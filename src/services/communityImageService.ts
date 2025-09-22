import { supabase } from "@/integrations/supabase/client";

export interface CommunityPostImage {
  id: string;
  post_id: string;
  image_url: string;
  image_path: string;
  alt_text?: string;
  file_size: number;
  file_type: string;
  upload_order: number;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadResult {
  success: boolean;
  image?: CommunityPostImage;
  error?: string;
}

/**
 * Upload an image to the asset bucket and store metadata
 */
export const uploadPostImage = async (
  postId: string,
  file: File,
  uploadOrder: number = 0,
  altText?: string
): Promise<ImageUploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'Image must be smaller than 5MB' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${postId}_${uploadOrder}_${Date.now()}.${fileExt}`;
    const filePath = `community-posts/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('asset')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('asset')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { data: imageData, error: dbError } = await supabase
      .from('community_post_images')
      .insert({
        post_id: postId,
        image_url: publicUrl,
        image_path: filePath,
        alt_text: altText,
        file_size: file.size,
        file_type: file.type,
        upload_order: uploadOrder
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('asset').remove([filePath]);
      console.error('Database error:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true, image: imageData };
  } catch (error) {
    console.error('Upload post image error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
};

/**
 * Get images for a specific post
 */
export const getPostImages = async (postId: string): Promise<CommunityPostImage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_post_images')
      .select('*')
      .eq('post_id', postId)
      .order('upload_order', { ascending: true });

    if (error) {
      console.error('Error fetching post images:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get post images error:', error);
    return [];
  }
};

/**
 * Get images for multiple posts
 */
export const getImagesForPosts = async (postIds: string[]): Promise<Map<string, CommunityPostImage[]>> => {
  try {
    if (postIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('community_post_images')
      .select('*')
      .in('post_id', postIds)
      .order('upload_order', { ascending: true });

    if (error) {
      console.error('Error fetching images for posts:', error);
      return new Map();
    }

    // Group images by post ID
    const imageMap = new Map<string, CommunityPostImage[]>();
    
    data?.forEach(image => {
      const postImages = imageMap.get(image.post_id) || [];
      postImages.push(image);
      imageMap.set(image.post_id, postImages);
    });

    return imageMap;
  } catch (error) {
    console.error('Get images for posts error:', error);
    return new Map();
  }
};

/**
 * Delete an image and its metadata
 */
export const deletePostImage = async (imageId: string): Promise<boolean> => {
  try {
    // Get image metadata first
    const { data: imageData, error: fetchError } = await supabase
      .from('community_post_images')
      .select('image_path')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      console.error('Error fetching image data:', fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('asset')
      .remove([imageData.image_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('community_post_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete post image error:', error);
    return false;
  }
};

/**
 * Update image metadata
 */
export const updateImageMetadata = async (
  imageId: string, 
  updates: { alt_text?: string; upload_order?: number }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('community_post_images')
      .update(updates)
      .eq('id', imageId);

    if (error) {
      console.error('Update image metadata error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update image metadata error:', error);
    return false;
  }
};

/**
 * Clean up orphaned images (images without associated posts)
 */
export const cleanupOrphanedImages = async (): Promise<number> => {
  try {
    // Find images that don't have associated posts
    const { data: orphanedImages, error: queryError } = await supabase
      .from('community_post_images')
      .select('id, image_path')
      .not('post_id', 'in', 
        supabase.from('community_posts').select('id')
      );

    if (queryError) {
      console.error('Error finding orphaned images:', queryError);
      return 0;
    }

    if (!orphanedImages || orphanedImages.length === 0) {
      return 0;
    }

    // Delete orphaned images
    const deletePromises = orphanedImages.map(async (image) => {
      // Delete from storage
      await supabase.storage.from('asset').remove([image.image_path]);
      // Delete from database
      await supabase
        .from('community_post_images')
        .delete()
        .eq('id', image.id);
    });

    await Promise.all(deletePromises);
    return orphanedImages.length;
  } catch (error) {
    console.error('Cleanup orphaned images error:', error);
    return 0;
  }
};