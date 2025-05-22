
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Video, VideoOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProps {
  lessonId: string;
  currentVideoUrl?: string;
  onUploadComplete?: (videoData: {
    url: string;
    path: string;
    duration?: number;
    metadata: any;
  }) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  lessonId,
  currentVideoUrl,
  onUploadComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl || '');
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${lessonId}/${fileName}`;

    setUploading(true);
    setProgress(0);
    try {
      // Upload the file to Supabase storage with progress tracking
      const options = {
        upsert: true,
        onUploadProgress: (progress: number) => {
          setProgress(Math.round(progress * 100));
        }
      };
      
      const { data, error } = await supabase.storage
        .from('course_videos')
        .upload(filePath, file, options);
      
      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course_videos')
        .getPublicUrl(filePath);
      
      // Update the local state
      setVideoUrl(publicUrl);
      
      // Store video metadata in the database
      const { data: metaData, error: metaError } = await supabase
        .from('video_metadata')
        .insert([
          { 
            lesson_id: lessonId,
            filename: fileName,
            original_filename: file.name,
            file_size: file.size,
            content_type: file.type,
            storage_path: filePath,
            wasabi_url: publicUrl,
          }
        ])
        .select()
        .single();
      
      if (metaError) throw metaError;
      
      // If callback function is provided, call it with the new URL and metadata
      if (onUploadComplete) {
        onUploadComplete({
          url: publicUrl,
          path: filePath,
          metadata: metaData
        });
      }

      toast.success('Video uploaded successfully');
    } catch (error) {
      toast.error('Error uploading video');
      console.error('Error uploading video:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {videoUrl ? (
        <div className="aspect-video relative bg-black/10 rounded-md overflow-hidden">
          <video 
            src={videoUrl} 
            controls 
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-muted rounded-md">
          <VideoOff className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      {uploading && (
        <div className="w-full">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {progress}% Uploaded
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="relative w-full"
          disabled={uploading}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="video/mp4,video/webm,video/avi,video/mov,video/mpeg"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : videoUrl ? 'Replace Video' : 'Upload Video'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        Accepted formats: MP4, WebM, AVI, MOV (max 500MB)
      </p>
    </div>
  );
};

export default VideoUpload;
