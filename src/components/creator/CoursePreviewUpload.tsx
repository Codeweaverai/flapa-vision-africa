
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Upload, Video, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface CoursePreviewUploadProps {
  courseId: string;
  existingPreviewUrl?: string;
  onUploadSuccess: (previewUrl: string) => void;
}

const CoursePreviewUpload = ({ 
  courseId, 
  existingPreviewUrl, 
  onUploadSuccess 
}: CoursePreviewUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(existingPreviewUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video file must be smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/preview.${fileExt}`;
      const filePath = `course-videos/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(filePath);

      // Update course preview in database
      const { error: dbError } = await supabase
        .from('course_previews')
        .upsert({
          course_id: courseId,
          preview_video_url: publicUrl,
          preview_video_path: filePath,
        });

      if (dbError) throw dbError;

      setPreviewUrl(publicUrl);
      onUploadSuccess(publicUrl);
      
      toast({
        title: "Preview Uploaded",
        description: "Course preview video has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading preview:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload preview video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePreview = async () => {
    if (!previewUrl) return;

    try {
      // Remove from database
      const { error: dbError } = await supabase
        .from('course_previews')
        .delete()
        .eq('course_id', courseId);

      if (dbError) throw dbError;

      setPreviewUrl('');
      onUploadSuccess('');
      
      toast({
        title: "Preview Removed",
        description: "Course preview video has been removed",
      });
    } catch (error) {
      console.error('Error removing preview:', error);
      toast({
        title: "Error",
        description: "Failed to remove preview video",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace Video
            </Button>
            <Button
              variant="outline"
              onClick={handleRemovePreview}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
          <div className="text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Preview Video</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a preview video to showcase your course content
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Video File
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            Uploading video... {uploadProgress}%
          </p>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="text-xs text-muted-foreground">
        <p>Supported formats: MP4, WebM, MOV</p>
        <p>Maximum file size: 50MB</p>
      </div>
    </div>
  );
};

export default CoursePreviewUpload;
