
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { getImagesForPosts, type CommunityPostImage } from './communityImageService';
import { getFollowStatusForUsers } from './communityFollowerService';

export interface CommentProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: CommentProfile;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  profiles?: Profile;
  comments?: Comment[];
  images?: CommunityPostImage[];
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  channel: string;
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  content: string;
  type: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export const fetchCommunityPosts = async (): Promise<CommunityPost[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;

    const { data, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community posts:', error);
      toast.error('Failed to load community posts');
      return [];
    }

    if (!data) return [];

    // Get like counts and user's like status for all posts
    const postIds = data.map(post => post.id);
    
    // Fetch like counts
    const { data: likeCounts } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    // Count likes per post
    const likeCountMap = new Map();
    likeCounts?.forEach(like => {
      likeCountMap.set(like.post_id, (likeCountMap.get(like.post_id) || 0) + 1);
    });

    // Fetch user's likes if authenticated
    let userLikes = new Set();
    if (userId) {
      const { data: userLikeData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);
      
      userLikes = new Set(userLikeData?.map(like => like.post_id) || []);
    }

    // Fetch comment counts
    const { data: commentCounts } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds);

    const commentCountMap = new Map();
    commentCounts?.forEach(comment => {
      commentCountMap.set(comment.post_id, (commentCountMap.get(comment.post_id) || 0) + 1);
    });

    // Fetch images for all posts
    const imagesMap = await getImagesForPosts(postIds);

    // Get follow status for post authors if user is authenticated
    let followStatusMap = new Map();
    if (userId) {
      const authorIds = data.map(post => post.user_id).filter(id => id !== userId);
      followStatusMap = await getFollowStatusForUsers(authorIds);
    }

    return data.map(post => ({
      ...post,
      like_count: likeCountMap.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0,
      user_has_liked: userLikes.has(post.id),
      images: imagesMap.get(post.id) || [],
      profiles: post.profiles ? {
        ...post.profiles,
        is_following: followStatusMap.get(post.user_id) || false
      } : undefined
    }));
  } catch (error) {
    console.error('Error in fetchCommunityPosts:', error);
    toast.error('Failed to load community posts');
    return [];
  }
};

export const createCommunityPost = async (
  userId?: string,
  title?: string,
  content?: string
): Promise<CommunityPost | null> => {
  try {
    if (!userId || !title || !content) {
      toast.error('Missing required fields');
      return null;
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return null;
    }

    toast.success('Post created successfully!');
    return data as CommunityPost;
  } catch (error) {
    console.error('Error in createCommunityPost:', error);
    toast.error('Failed to create post');
    return null;
  }
};

export const createCommunityComment = async (
  userId: string,
  postId: string,
  content: string
): Promise<Comment | null> => {
  try {
    if (!userId || !postId || !content) {
      toast.error('Missing required fields');
      return null;
    }

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content,
      })
      .select(`
        id,
        post_id,
        user_id,
        content,
        created_at,
        profiles: user_id (id, username, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
      return null;
    }

    toast.success('Comment added successfully!');
    return data as unknown as Comment;
  } catch (error) {
    console.error('Error in createCommunityComment:', error);
    toast.error('Failed to add comment');
    return null;
  }
};

// Add the missing chat message functions
export const fetchChatMessages = async (): Promise<CommunityMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        profiles: user_id (username, full_name, avatar_url)
      `)
      .eq('channel', 'general')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      toast.error('Failed to load chat messages');
      return [];
    }

    return data as unknown as CommunityMessage[];
  } catch (error) {
    console.error('Error in fetchChatMessages:', error);
    toast.error('Failed to load chat messages');
    return [];
  }
};

export const sendChatMessage = async (
  userId: string,
  content: string,
  channel: string = 'general'
): Promise<CommunityMessage | null> => {
  try {
    if (!userId || !content) {
      toast.error('Missing required fields');
      return null;
    }

    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        user_id: userId,
        content,
        channel,
      })
      .select(`
        *,
        profiles: user_id (username, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }

    return data as unknown as CommunityMessage;
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    toast.error('Failed to send message');
    return null;
  }
};

// Add the missing notification functions
export const fetchUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user notifications:', error);
      toast.error('Failed to load notifications');
      return [];
    }

    return data as Notification[];
  } catch (error) {
    console.error('Error in fetchUserNotifications:', error);
    toast.error('Failed to load notifications');
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    toast.error('Failed to update notification');
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to update notifications');
      return false;
    }

    toast.success('All notifications marked as read');
    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    toast.error('Failed to update notifications');
    return false;
  }
};
