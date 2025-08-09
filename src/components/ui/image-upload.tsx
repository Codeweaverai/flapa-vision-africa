import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient'; // Make sure this points to your Supabase instance

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageUpload, 
  currentImage, 
  className = "" 
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(currentImage || '');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a preview URL for the UI
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      // Create a unique file name to avoid overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('speaker-images') // bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        setPreviewImage(currentImage || '');
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('speaker-images')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      onImageUpload(publicUrl);

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setPreviewImage(currentImage || '');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewImage('');
    onImageUpload('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Profile Image</Label>
      <div className="flex items-center gap-4">
        {previewImage ? (
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload an image (max 5MB)
          </p>
        </div>
      </div>
      
      {uploading && (
        <div className="text-sm text-gray-500">Uploading image...</div>
      )}
    </div>
  );
};

export default ImageUpload;

