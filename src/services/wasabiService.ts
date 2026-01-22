
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface SupabaseUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  storage: 'supabase';
}

// Upload file directly to Supabase storage
export const uploadFileWithFallback = async (
  file: File,
  fileType: 'video' | 'material' = 'video'
): Promise<{ success: boolean; url?: string; error?: string; storage: 'supabase' }> => {
  try {
    const bucketName = fileType === 'video' ? 'course-videos' : 'course-materials';
    const fileExt = file.name.split('.').pop();
    const fileName = `${fileType}-${Date.now()}-${uuidv4()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('Supabase upload successful');
    return {
      success: true,
      url: publicUrl,
      storage: 'supabase'
    };
  } catch (error) {
    console.error('Supabase upload failed:', error);
    return {
      success: false,
      error: `Supabase upload failed: ${error}`,
      storage: 'supabase'
    };
  }
};

// Helper function to save video metadata to Supabase
export const saveVideoMetadata = async (
  lessonId: string,
  originalFilename: string,
  fileSize: number,
  contentType: string,
  url: string,
  storageType: 'supabase',
  duration?: number
): Promise<{ id: string; url: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('video_metadata')
      .insert({
        lesson_id: lessonId,
        filename: originalFilename,
        original_filename: originalFilename,
        file_size: fileSize,
        content_type: contentType,
        storage_path: url,
        wasabi_url: null, // No longer using Wasabi
        duration_seconds: duration || null
      })
      .select('id, storage_path');

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return {
      id: data[0].id,
      url: data[0].storage_path
    };
  } catch (error) {
    console.error('Error saving video metadata:', error);
    return null;
  }
};

// Get video metadata for a lesson
export const getVideoMetadata = async (lessonId: string) => {
  try {
    const { data, error } = await supabase
      .from('video_metadata')
      .select('*')
      .eq('lesson_id', lessonId);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data[0];
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
};
