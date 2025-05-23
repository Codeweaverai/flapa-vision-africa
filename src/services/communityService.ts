
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  comments?: Comment[];
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
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles: user_id (id, username, full_name, avatar_url),
        comments: post_comments (
          id,
          post_id,
          user_id,
          content,
          created_at,
          profiles: user_id (id, username, full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community posts:', error);
      toast.error('Failed to load community posts');
      return [];
    }

    return posts as unknown as CommunityPost[];
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
