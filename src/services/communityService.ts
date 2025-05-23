
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

    return posts as CommunityPost[];
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
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
      return null;
    }

    toast.success('Comment added successfully!');
    return data as Comment;
  } catch (error) {
    console.error('Error in createCommunityComment:', error);
    toast.error('Failed to add comment');
    return null;
  }
};
