import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export class FundraisingImageService {
  private static readonly BUCKET_NAME = 'fundraising_assets';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: 'File must be an image (JPEG, PNG, WebP, GIF)' };
    }

    return { valid: true };
  }

  static async uploadCampaignImage(
    file: File, 
    campaignId: string, 
    userId: string
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `campaigns/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Upload failed:', error);
      return { 
        success: false, 
        error: 'Failed to upload image' 
      };
    }
  }

  static async deleteCampaignImage(imagePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract the path after 'campaigns/'
      const pathWithoutPrefix = imagePath.replace('campaigns/', '');
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([pathWithoutPrefix]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete image' };
    }
  }

  static async updateCampaignImage(
    oldImagePath: string | null,
    newFile: File,
    campaignId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Delete old image if it exists
      if (oldImagePath) {
        await this.deleteCampaignImage(oldImagePath);
      }

      // Upload new image
      return await this.uploadCampaignImage(newFile, campaignId, userId);
    } catch (error) {
      console.error('Update failed:', error);
      return { 
        success: false, 
        error: 'Failed to update image' 
      };
    }
  }

  // Helper to extract file name from URL for deletion
  static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.BUCKET_NAME);
      
      if (bucketIndex !== -1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      return null;
    } catch {
      return null;
    }
  }
}
