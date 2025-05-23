
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, X } from 'lucide-react';
import { toast } from 'sonner';

export interface ProfilePictureUploadProps {
  existingUrl?: string;
  onUploadComplete: (url: string) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  existingUrl,
  onUploadComplete
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingUrl || null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!user) {
        toast.error('You must be logged in to upload an avatar');
        return;
      }
      
      const files = event.target.files;
      if (!files || files.length === 0) {
        toast.error('You must select an image to upload.');
        return;
      }
      
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Create profile_pictures bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.getBucket('profile_pictures');
      if (!buckets) {
        await supabase.storage.createBucket('profile_pictures', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
      }

      // Upload image to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;
      
      // Save avatar_url and storage_path in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          avatar_storage_path: filePath
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(avatarUrl);
      onUploadComplete(avatarUrl);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      
      if (!user) {
        toast.error('You must be logged in to remove your avatar');
        return;
      }
      
      // Get the current avatar storage path
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('avatar_storage_path')
        .eq('id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (data?.avatar_storage_path) {
        // Remove file from storage
        const { error: removeError } = await supabase.storage
          .from('profile_pictures')
          .remove([data.avatar_storage_path]);
          
        if (removeError) throw removeError;
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          avatar_storage_path: null
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(null);
      onUploadComplete('');
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Error removing avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>
          <User className="h-12 w-12 text-gray-400" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          className="relative"
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/png, image/jpeg, image/gif, image/webp"
            onChange={uploadAvatar}
            disabled={uploading}
          />
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
        
        {avatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={removeAvatar}
            disabled={uploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
