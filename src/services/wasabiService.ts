
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Wasabi configuration
const WASABI_ACCESS_KEY = 'T4IRLRM3YEE4VOMEEC3X';
const WASABI_SECRET_KEY = 'I9wFpzT5SqdO6LrNhOsyDHsHqZI9bQXCUU6Pgnbe';
const WASABI_BUCKET = 'skillpulse';
const WASABI_REGION = 'us-east-1';
const WASABI_ENDPOINT = `https://s3.${WASABI_REGION}.wasabisys.com`;

// Helper function to generate a pre-signed URL for uploading directly to Wasabi
export const generateUploadUrl = async (filename: string, contentType: string): Promise<{
  url: string;
  uploadId: string;
  key: string;
} | null> => {
  try {
    // In a real-world scenario, you would call a secure backend function to generate this URL
    // For now, we'll use a simulated approach
    
    // Generate a unique ID for the upload
    const uploadId = uuidv4();
    // Create a key for the file in the bucket
    const key = `course-videos/${uploadId}-${filename}`;
    
    // In a real implementation, this would call a Supabase Edge Function that uses S3 SDK
    // to generate a pre-signed URL securely using your Wasabi credentials

    // For now, we'll return a simulated response
    return {
      url: `${WASABI_ENDPOINT}/${WASABI_BUCKET}/${key}`,
      uploadId,
      key
    };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return null;
  }
};

// Helper function to save video metadata to Supabase
export const saveVideoMetadata = async (
  lessonId: string,
  originalFilename: string,
  fileSize: number,
  contentType: string,
  key: string,
  duration?: number
): Promise<{ id: string; wasabi_url: string } | null> => {
  try {
    const wasabiUrl = `${WASABI_ENDPOINT}/${WASABI_BUCKET}/${key}`;
    
    // Use array selection instead of single() to avoid 406 errors
    const { data, error } = await supabase
      .from('video_metadata')
      .insert({
        lesson_id: lessonId,
        filename: key,
        original_filename: originalFilename,
        file_size: fileSize,
        content_type: contentType,
        storage_path: key,
        wasabi_url: wasabiUrl,
        duration_seconds: duration || null
      })
      .select('id, wasabi_url');
    
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data[0];
  } catch (error) {
    console.error('Error saving video metadata:', error);
    return null;
  }
};

// Helper function to upload a file directly to Wasabi
export const uploadFileToWasabi = async (
  file: File,
  lessonId: string
): Promise<{ id: string; wasabi_url: string } | null> => {
  try {
    // In a production environment, this would be implemented with a secure backend
    // that handles the S3/Wasabi upload using the AWS SDK
    
    // For this implementation, we'll simulate the upload and just save the metadata
    // In a real implementation, we would:
    // 1. Generate a pre-signed URL from a backend function
    // 2. Upload the file directly to Wasabi using fetch() or axios
    // 3. Save the metadata to Supabase once upload is successful
    
    // Simulate a delay to represent upload time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a unique filename
    const key = `course-videos/${uuidv4()}-${file.name}`;
    const wasabiUrl = `${WASABI_ENDPOINT}/${WASABI_BUCKET}/${key}`;
    
    // Save the metadata to Supabase using array selection instead of single()
    const { data, error } = await supabase
      .from('video_metadata')
      .insert({
        lesson_id: lessonId,
        filename: key,
        original_filename: file.name,
        file_size: file.size,
        content_type: file.type,
        storage_path: key,
        wasabi_url: wasabiUrl,
        // In a real implementation, we would extract the duration from the video
        duration_seconds: null
      })
      .select('id, wasabi_url');
    
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data[0];
  } catch (error) {
    console.error('Error uploading file to Wasabi:', error);
    return null;
  }
};

// Get video metadata for a lesson
export const getVideoMetadata = async (lessonId: string) => {
  try {
    // Use array selection instead of single() to avoid 406 errors
    const { data, error } = await supabase
      .from('video_metadata')
      .select('*')
      .eq('lesson_id', lessonId);
    
    if (error) throw error;
    if (!data || data.length === 0) return null;
    
    // Return the first metadata entry for this lesson
    return data[0];
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
};
