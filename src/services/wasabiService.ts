
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface WasabiUploadResponse {
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  bucket?: string;
  error?: string;
}

// Generate a pre-signed URL for uploading directly to Wasabi via edge function
export const generateWasabiUploadUrl = async (
  filename: string, 
  contentType: string,
  fileType: 'video' | 'material' = 'video'
): Promise<WasabiUploadResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-wasabi-upload-url', {
      body: {
        filename,
        contentType,
        fileType
      }
    });

    if (error) {
      console.error('Error generating Wasabi upload URL:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('Error calling Wasabi upload URL function:', error);
    return { success: false, error: 'Failed to generate upload URL' };
  }
};

// Upload file to Wasabi with Supabase fallback
export const uploadFileWithFallback = async (
  file: File,
  fileType: 'video' | 'material' = 'video'
): Promise<{ success: boolean; url?: string; error?: string; storage: 'wasabi' | 'supabase' }> => {
  
  // First, try Wasabi upload
  try {
    console.log('Attempting Wasabi upload for:', file.name);
    
    // Get upload URL from edge function
    const uploadResponse = await generateWasabiUploadUrl(file.name, file.type, fileType);
    
    if (uploadResponse.success && uploadResponse.uploadUrl && uploadResponse.publicUrl) {
      // Upload file to Wasabi using the provided URL
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadResult.ok) {
        console.log('Wasabi upload successful');
        return {
          success: true,
          url: uploadResponse.publicUrl,
          storage: 'wasabi'
        };
      } else {
        console.error('Wasabi upload failed with status:', uploadResult.status);
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }
    } else {
      throw new Error(uploadResponse.error || 'Failed to get upload URL');
    }
  } catch (error) {
    console.error('Wasabi upload failed:', error);
    console.log('Falling back to Supabase storage');
    
    // Fallback to Supabase storage
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

      console.log('Supabase fallback upload successful');
      return {
        success: true,
        url: publicUrl,
        storage: 'supabase'
      };
    } catch (fallbackError) {
      console.error('Supabase fallback upload also failed:', fallbackError);
      return {
        success: false,
        error: `Both Wasabi and Supabase uploads failed: ${error}`,
        storage: 'supabase'
      };
    }
  }
};

// Helper function to save video metadata to Supabase
export const saveVideoMetadata = async (
  lessonId: string,
  originalFilename: string,
  fileSize: number,
  contentType: string,
  url: string,
  storageType: 'wasabi' | 'supabase',
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
        wasabi_url: storageType === 'wasabi' ? url : null,
        duration_seconds: duration || null
      })
      .select('id, wasabi_url, storage_path');
    
    if (error) throw error;
    if (!data || data.length === 0) return null;
    
    return {
      id: data[0].id,
      url: data[0].wasabi_url || data[0].storage_path
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
