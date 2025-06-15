import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Define MediaPost type with new podcast fields
export interface MediaPost {
  id: string;
  title: string;
  content: string;
  summary?: string;
  post_type: 'news' | 'podcast' | 'resource';
  category?: string; 
  image_url?: string;
  media_url?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  duration_minutes?: number;
  is_published: boolean;
  // New podcast-specific fields
  guest_names?: string;
  recording_date?: string;
  episode_number?: string;
  series_name?: string;
  tags?: string[];
  media_type?: 'external_url' | 'uploaded_file';
  file_storage_path?: string;
  scheduled_publish_at?: string;
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
    let fileStoragePath: string | undefined;

    // Upload image if provided
    if (imageFile) {
      const imagePath = `${postData.post_type}/${uuidv4()}-${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('podcast-covers')
        .upload(imagePath, imageFile);

      if (imageError) {
        console.error('Error uploading image:', imageError);
        toast.error(`Failed to upload image: ${imageError.message}`);
        return null;
      }

      // Get public URL for the image
      const { data: urlData } = await supabase.storage
        .from('podcast-covers')
        .getPublicUrl(imagePath);

      imageUrl = urlData.publicUrl;
    }

    // Upload media file if provided (for podcasts and resources)
    if (mediaFile) {
      // Determine bucket based on file type and post type
      let bucketName = 'podcast-audio';
      if (postData.post_type === 'podcast') {
        // Check if it's a video or audio file
        if (mediaFile.type.startsWith('video/')) {
          bucketName = 'podcast-videos';
        } else if (mediaFile.type.startsWith('audio/')) {
          bucketName = 'podcast-audio';
        }
      }
      
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
      fileStoragePath = `${bucketName}/${mediaPath}`;
    }

    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error('You must be logged in to create posts');
      return null;
    }

    // Create the post object with new podcast fields
    const post = {
      title: postData.title,
      content: postData.content,
      summary: postData.summary || postData.content.substring(0, 150) + '...',
      post_type: postData.post_type,
      category: postData.category,
      image_url: imageUrl,
      media_url: mediaUrl,
      author_id: userData.user.id,
      duration_minutes: postData.duration_minutes,
      is_published: postData.is_published ?? true,
      guest_names: postData.guest_names,
      recording_date: postData.recording_date,
      episode_number: postData.episode_number,
      series_name: postData.series_name,
      tags: postData.tags,
      media_type: mediaFile ? 'uploaded_file' : 'external_url',
      file_storage_path: fileStoragePath,
      scheduled_publish_at: postData.scheduled_publish_at
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
    let fileStoragePath: string | undefined = postData.file_storage_path;

    // Upload new image if provided
    if (imageFile) {
      const imagePath = `${postData.post_type}/${uuidv4()}-${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('podcast-covers')
        .upload(imagePath, imageFile);

      if (imageError) {
        console.error('Error uploading image:', imageError);
        toast.error(`Failed to upload image: ${imageError.message}`);
        return null;
      }

      // Get public URL for the image
      const { data: urlData } = await supabase.storage
        .from('podcast-covers')
        .getPublicUrl(imagePath);

      imageUrl = urlData.publicUrl;
    }

    // Upload new media file if provided
    if (mediaFile) {
      let bucketName = 'podcast-audio';
      if (postData.post_type === 'podcast') {
        if (mediaFile.type.startsWith('video/')) {
          bucketName = 'podcast-videos';
        } else if (mediaFile.type.startsWith('audio/')) {
          bucketName = 'podcast-audio';
        }
      }
      
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
      fileStoragePath = `${bucketName}/${mediaPath}`;
    }

    // Update the post with new podcast fields
    const updateData = {
      ...postData,
      image_url: imageUrl,
      media_url: mediaUrl,
      file_storage_path: fileStoragePath,
      media_type: mediaFile ? 'uploaded_file' : (postData.media_url ? 'external_url' : postData.media_type),
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

// Get media posts with optional filtering by type and better podcast categorization
export const getMediaPosts = async (
  type?: 'news' | 'podcast' | 'resource',
  includeUnpublished = false,
  podcastFilter?: 'video' | 'audio'
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

    let posts = data as unknown as MediaPost[];

    // Filter podcasts by video/audio if specified
    if (type === 'podcast' && podcastFilter) {
      posts = posts.filter(post => {
        if (podcastFilter === 'video') {
          // Video podcasts: either has video URL or uploaded video file
          return post.media_url?.includes('youtube') || 
                 post.media_url?.includes('vimeo') || 
                 post.file_storage_path?.includes('podcast-videos') ||
                 post.category === 'video-podcast';
        } else if (podcastFilter === 'audio') {
          // Audio podcasts: uploaded audio files or non-video URLs
          return post.file_storage_path?.includes('podcast-audio') ||
                 (!post.media_url?.includes('youtube') && 
                  !post.media_url?.includes('vimeo') && 
                  !post.file_storage_path?.includes('podcast-videos') &&
                  post.category !== 'video-podcast');
        }
        return true;
      });
    }

    return posts;
  } catch (error: any) {
    console.error('Error in getMediaPosts:', error);
    toast.error(`Failed to fetch media posts: ${error.message || 'Unknown error'}`);
    return [];
  }
};

// Get a single media post by ID
export const getMediaPostById = async (id: string): Promise<MediaPost | null> => {
  try {
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
