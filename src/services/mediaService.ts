import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Define MediaPost type
export interface MediaPost {
  id: string;
  title: string;
  content: string;
  summary?: string;
  post_type: 'news' | 'podcast' | 'resource';
  category?: string; // Add category field
  image_url?: string;
  media_url?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  duration_minutes?: number;
  is_published: boolean;
}

// Define MediaCategory type - keeping for backwards compatibility but not actively used anymore
export interface MediaCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Create a new media post
export const createMediaPost = async (
  postData: Partial<MediaPost>, 
  imageFile?: File,
  mediaFile?: File
): Promise<MediaPost | null> => {
  try {
    // Check for required fields
    if (!postData.title || !postData.content || !postData.post_type) {
      toast.error('Please fill in all required fields');
      return null;
    }

    let imageUrl: string | undefined = postData.image_url;
    let mediaUrl: string | undefined = postData.media_url;

    // Upload image if provided
    if (imageFile) {
      const imagePath = `${postData.post_type}/${uuidv4()}-${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('media-images')
        .upload(imagePath, imageFile);

      if (imageError) {
        console.error('Error uploading image:', imageError);
        toast.error(`Failed to upload image: ${imageError.message}`);
        return null;
      }

      // Get public URL for the image
      const { data: urlData } = await supabase.storage
        .from('media-images')
        .getPublicUrl(imagePath);

      imageUrl = urlData.publicUrl;
    }

    // Upload media file if provided (for podcasts and resources)
    if (mediaFile) {
      const bucketName = postData.post_type === 'podcast' ? 'podcast-audio' : 'resource-files';
      const mediaPath = `${postData.post_type}/${uuidv4()}-${mediaFile.name}`;
      const { data: mediaData, error: mediaError } = await supabase.storage
        .from(bucketName)
        .upload(mediaPath, mediaFile);

      if (mediaError) {
        console.error('Error uploading media file:', mediaError);
        toast.error(`Failed to upload media file: ${mediaError.message}`);
        return null;
      }

      // Get public URL for the media file
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(mediaPath);

      mediaUrl = urlData.publicUrl;
    }

    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error('You must be logged in to create posts');
      return null;
    }

    // Create the post object
    const post = {
      title: postData.title,
      content: postData.content,
      summary: postData.summary || postData.content.substring(0, 150) + '...',
      post_type: postData.post_type,
      category: postData.category, // Include category field
      image_url: imageUrl,
      media_url: mediaUrl,
      author_id: userData.user.id,
      duration_minutes: postData.duration_minutes,
      is_published: postData.is_published ?? true
    };

    // Insert the post
    const { data, error } = await supabase
      .from('media_posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      console.error('Error creating media post:', error);
      toast.error(`Failed to create post: ${error.message}`);
      return null;
    }

    toast.success('Media post created successfully');
    return data as unknown as MediaPost;
  } catch (error: any) {
    console.error('Error in createMediaPost:', error);
    toast.error(`Failed to create media post: ${error.message || 'Unknown error'}`);
    return null;
  }
};

// Update an existing media post
export const updateMediaPost = async (
  id: string,
  postData: Partial<MediaPost>,
  imageFile?: File,
  mediaFile?: File
): Promise<MediaPost | null> => {
  try {
    let imageUrl: string | undefined = postData.image_url;
    let mediaUrl: string | undefined = postData.media_url;

    // Upload new image if provided
    if (imageFile) {
      const imagePath = `${postData.post_type}/${uuidv4()}-${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('media-images')
        .upload(imagePath, imageFile);

      if (imageError) {
        console.error('Error uploading image:', imageError);
        toast.error(`Failed to upload image: ${imageError.message}`);
        return null;
      }

      // Get public URL for the image
      const { data: urlData } = await supabase.storage
        .from('media-images')
        .getPublicUrl(imagePath);

      imageUrl = urlData.publicUrl;
    }

    // Upload new media file if provided
    if (mediaFile) {
      const bucketName = postData.post_type === 'podcast' ? 'podcast-audio' : 'resource-files';
      const mediaPath = `${postData.post_type}/${uuidv4()}-${mediaFile.name}`;
      const { data: mediaData, error: mediaError } = await supabase.storage
        .from(bucketName)
        .upload(mediaPath, mediaFile);

      if (mediaError) {
        console.error('Error uploading media file:', mediaError);
        toast.error(`Failed to upload media file: ${mediaError.message}`);
        return null;
      }

      // Get public URL for the media file
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(mediaPath);

      mediaUrl = urlData.publicUrl;
    }

    // Update the post
    const updateData = {
      ...postData,
      image_url: imageUrl,
      media_url: mediaUrl,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('media_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating media post:', error);
      toast.error(`Failed to update post: ${error.message}`);
      return null;
    }

    toast.success('Media post updated successfully');
    return data as MediaPost;
  } catch (error: any) {
    console.error('Error in updateMediaPost:', error);
    toast.error(`Failed to update media post: ${error.message || 'Unknown error'}`);
    return null;
  }
};

// Delete a media post
export const deleteMediaPost = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('media_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting media post:', error);
      toast.error(`Failed to delete post: ${error.message}`);
      return false;
    }

    toast.success('Media post deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error in deleteMediaPost:', error);
    toast.error(`Failed to delete media post: ${error.message || 'Unknown error'}`);
    return false;
  }
};

// Get media posts with optional filtering by type
export const getMediaPosts = async (
  type?: 'news' | 'podcast' | 'resource',
  includeUnpublished = false
): Promise<MediaPost[]> => {
  try {
    let query = supabase
      .from('media_posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (type) {
      query = query.eq('post_type', type);
    }

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching media posts:', error);
      toast.error(`Failed to fetch media posts: ${error.message}`);
      return [];
    }

    return data as unknown as MediaPost[];
  } catch (error: any) {
    console.error('Error in getMediaPosts:', error);
    toast.error(`Failed to fetch media posts: ${error.message || 'Unknown error'}`);
    return [];
  }
};

// Get a single media post by ID
export const getMediaPostById = async (id: string): Promise<MediaPost | null> => {
  try {
    // Get the post
    const { data: post, error } = await supabase
      .from('media_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching media post:', error);
      return null;
    }

    return post as MediaPost;
  } catch (error: any) {
    console.error('Error in getMediaPostById:', error);
    return null;
  }
};

// Get all categories (keeping for backwards compatibility)
export const getMediaCategories = async (): Promise<MediaCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('media_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching media categories:', error);
      toast.error(`Failed to fetch categories: ${error.message}`);
      return [];
    }

    // Make sure we always return an array, even if data is null
    return (data as MediaCategory[]) || [];
  } catch (error: any) {
    console.error('Error in getMediaCategories:', error);
    toast.error(`Failed to fetch categories: ${error.message || 'Unknown error'}`);
    return [];
  }
};

// Create a new category (keeping for backwards compatibility)
export const createMediaCategory = async (name: string, description?: string): Promise<MediaCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('media_categories')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      console.error('Error creating media category:', error);
      toast.error(`Failed to create category: ${error.message}`);
      return null;
    }

    toast.success('Category created successfully');
    return data as MediaCategory;
  } catch (error: any) {
    console.error('Error in createMediaCategory:', error);
    toast.error(`Failed to create category: ${error.message || 'Unknown error'}`);
    return null;
  }
};
