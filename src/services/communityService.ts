
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
}

export interface CourseComment {
  id: string;
  course_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  channel: string;
  profiles?: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  content: string;
  type: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
}

// Community Posts Functions
export const fetchCommunityPosts = async (): Promise<CommunityPost[]> => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id(username, avatar_url, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching community posts:', error);
    toast.error('Failed to load community posts');
    return [];
  }
};

export const createCommunityPost = async (userId: string, title: string, content: string): Promise<CommunityPost | null> => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        title,
        content
      })
      .select('*')
      .single();

    if (error) throw error;
    toast.success('Post created successfully');
    return data;
  } catch (error) {
    console.error('Error creating community post:', error);
    toast.error('Failed to create post');
    return null;
  }
};

// Course Comments Functions
export const fetchCourseComments = async (courseId: string): Promise<CourseComment[]> => {
  try {
    const { data, error } = await supabase
      .from('course_comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url, full_name)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching course comments:', error);
    toast.error('Failed to load comments');
    return [];
  }
};

export const createCourseComment = async (userId: string, courseId: string, content: string): Promise<CourseComment | null> => {
  try {
    const { data, error } = await supabase
      .from('course_comments')
      .insert({
        user_id: userId,
        course_id: courseId,
        content
      })
      .select('*')
      .single();

    if (error) throw error;
    toast.success('Comment added successfully');
    return data;
  } catch (error) {
    console.error('Error creating course comment:', error);
    toast.error('Failed to add comment');
    return null;
  }
};

// Chat Messages Functions
export const fetchChatMessages = async (channel = 'general'): Promise<CommunityMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, full_name)
      `)
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    toast.error('Failed to load messages');
    return [];
  }
};

export const sendChatMessage = async (userId: string, content: string, channel = 'general'): Promise<CommunityMessage | null> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        user_id: userId,
        content,
        channel
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    toast.error('Failed to send message');
    return null;
  }
};

// Notifications Functions
export const fetchUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};
