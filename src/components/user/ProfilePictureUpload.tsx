
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  username?: string;
  onUploadComplete?: (url: string, path: string) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  username,
  onUploadComplete
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    setUploading(true);
    try {
      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile_pictures')
        .upload(filePath, file, { upsert: true });
      
      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);
      
      // Update the local state
      setImageUrl(publicUrl);
      
      // If callback function is provided, call it with the new URL
      if (onUploadComplete) {
        onUploadComplete(publicUrl, filePath);
      }

      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      toast.error('Error uploading profile picture');
      console.error('Error uploading profile picture:', error);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={imageUrl} alt="Profile" className="object-cover" />
        <AvatarFallback>
          <User className="h-12 w-12 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          disabled={uploading}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/png, image/jpeg, image/gif, image/webp"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        Recommended: Square image, at least 300x300px
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
