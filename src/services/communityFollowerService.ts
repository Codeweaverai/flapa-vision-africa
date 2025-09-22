import { supabase } from "@/integrations/supabase/client";

export interface CommunityFollower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  updated_at: string;
}

export interface FollowerProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
}

/**
 * Follow a user
 */
export const followUser = async (followingId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('community_followers')
      .select('id')
      .eq('follower_id', user.user.id)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      return true; // Already following
    }

    const { error } = await supabase
      .from('community_followers')
      .insert({
        follower_id: user.user.id,
        following_id: followingId
      });

    if (error) {
      console.error('Follow user error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Follow user error:', error);
    return false;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followingId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('community_followers')
      .delete()
      .eq('follower_id', user.user.id)
      .eq('following_id', followingId);

    if (error) {
      console.error('Unfollow user error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unfollow user error:', error);
    return false;
  }
};

/**
 * Check if current user is following another user
 */
export const isFollowing = async (followingId: string): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    const { data, error } = await supabase
      .from('community_followers')
      .select('id')
      .eq('follower_id', user.user.id)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Is following check error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Is following check error:', error);
    return false;
  }
};

/**
 * Get followers of a user
 */
export const getFollowers = async (userId: string): Promise<FollowerProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('community_followers')
      .select(`
        follower_id,
        created_at,
        profiles!community_followers_follower_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get followers error:', error);
      return [];
    }

    return data?.map(item => ({
      id: item.follower_id,
      username: item.profiles?.username,
      full_name: item.profiles?.full_name,
      avatar_url: item.profiles?.avatar_url,
      created_at: item.created_at
    })) || [];
  } catch (error) {
    console.error('Get followers error:', error);
    return [];
  }
};

/**
 * Get users that a user is following
 */
export const getFollowing = async (userId: string): Promise<FollowerProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('community_followers')
      .select(`
        following_id,
        created_at,
        profiles!community_followers_following_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get following error:', error);
      return [];
    }

    return data?.map(item => ({
      id: item.following_id,
      username: item.profiles?.username,
      full_name: item.profiles?.full_name,
      avatar_url: item.profiles?.avatar_url,
      created_at: item.created_at
    })) || [];
  } catch (error) {
    console.error('Get following error:', error);
    return [];
  }
};

/**
 * Get follow statistics for a user
 */
export const getFollowStats = async (userId: string): Promise<FollowStats> => {
  try {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('community_followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followersError) {
      console.error('Get followers count error:', followersError);
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('community_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followingError) {
      console.error('Get following count error:', followingError);
    }

    return {
      followers_count: followersCount || 0,
      following_count: followingCount || 0
    };
  } catch (error) {
    console.error('Get follow stats error:', error);
    return {
      followers_count: 0,
      following_count: 0
    };
  }
};

/**
 * Get posts from followed users
 */
export const getFollowedUsersPosts = async (userId: string, limit: number = 20, offset: number = 0) => {
  try {
    // First get the list of users being followed
    const { data: followingData, error: followingError } = await supabase
      .from('community_followers')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingError) {
      console.error('Get following list error:', followingError);
      return [];
    }

    if (!followingData || followingData.length === 0) {
      return [];
    }

    const followingIds = followingData.map(f => f.following_id);

    // Get posts from followed users
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Get followed users posts error:', postsError);
      return [];
    }

    return posts || [];
  } catch (error) {
    console.error('Get followed users posts error:', error);
    return [];
  }
};

/**
 * Get mutual followers between two users
 */
export const getMutualFollowers = async (userId1: string, userId2: string): Promise<string[]> => {
  try {
    // Get followers of user1
    const { data: user1Followers, error: error1 } = await supabase
      .from('community_followers')
      .select('follower_id')
      .eq('following_id', userId1);

    if (error1) {
      console.error('Get user1 followers error:', error1);
      return [];
    }

    // Get followers of user2
    const { data: user2Followers, error: error2 } = await supabase
      .from('community_followers')
      .select('follower_id')
      .eq('following_id', userId2);

    if (error2) {
      console.error('Get user2 followers error:', error2);
      return [];
    }

    if (!user1Followers || !user2Followers) {
      return [];
    }

    // Find mutual followers
    const user1FollowerIds = new Set(user1Followers.map(f => f.follower_id));
    const mutualFollowers = user2Followers
      .filter(f => user1FollowerIds.has(f.follower_id))
      .map(f => f.follower_id);

    return mutualFollowers;
  } catch (error) {
    console.error('Get mutual followers error:', error);
    return [];
  }
};

/**
 * Check follow status for multiple users
 */
export const getFollowStatusForUsers = async (userIds: string[]): Promise<Map<string, boolean>> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || userIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('community_followers')
      .select('following_id')
      .eq('follower_id', user.user.id)
      .in('following_id', userIds);

    if (error) {
      console.error('Get follow status for users error:', error);
      return new Map();
    }

    const followingSet = new Set(data?.map(f => f.following_id) || []);
    const statusMap = new Map<string, boolean>();
    
    userIds.forEach(userId => {
      statusMap.set(userId, followingSet.has(userId));
    });

    return statusMap;
  } catch (error) {
    console.error('Get follow status for users error:', error);
    return new Map();
  }
};