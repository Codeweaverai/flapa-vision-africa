
import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  size = 'lg'
}) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Profile Pictures')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Profile Pictures')
        .getPublicUrl(filePath);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      onImageUpdate(publicUrl);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentImageUrl} alt="Profile picture" />
          <AvatarFallback>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          variant="outline"
          onClick={triggerFileInput}
          disabled={uploading}
          className="absolute bottom-0 right-0 rounded-full p-2 h-8 w-8 bg-background border-2 border-background shadow-md hover:bg-accent"
        >
          {uploading ? (
            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      <Button
        variant="outline"
        onClick={triggerFileInput}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading...' : 'Change Picture'}
      </Button>
    </div>
  );
};

export default ProfilePictureUpload;
