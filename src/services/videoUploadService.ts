import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  storage: 'supabase';
}

/**
 * Uploads a video file to Supabase storage
 */
export const uploadVideoToSupabase = async (
  file: File,
  fileType: 'video' | 'material' = 'video'
): Promise<UploadResult> => {
  try {
    // Determine bucket based on file type
    const bucketName = fileType === 'video' ? 'course-videos' : 'course-materials';
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${fileType}-${Date.now()}-${uuidv4()}.${fileExt}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log(`File uploaded successfully to Supabase: ${publicUrl}`);
    
    return {
      success: true,
      url: publicUrl,
      storage: 'supabase'
    };
  } catch (error: any) {
    console.error('Supabase upload failed:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
      storage: 'supabase'
    };
  }
};

/**
 * Uploads a file with fallback mechanism (currently only Supabase, but can be extended)
 */
export const uploadFileWithFallback = async (
  file: File,
  fileType: 'video' | 'material' = 'video'
): Promise<UploadResult> => {
  try {
    // Currently only using Supabase storage
    const result = await uploadVideoToSupabase(file, fileType);
    return result;
  } catch (error: any) {
    console.error('Upload with fallback failed:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
      storage: 'supabase'
    };
  }
};

/**
 * Deletes a file from Supabase storage
 */
export const deleteFileFromSupabase = async (
  filePath: string,
  bucketName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Delete from Supabase failed:', error);
    return { success: false, error: error.message };
  }
};