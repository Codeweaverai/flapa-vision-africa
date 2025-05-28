
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, File, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Lesson, createLesson, updateLesson } from "@/services/courseService";

export interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  onLessonSaved: (lesson: Lesson) => void;
  editingLesson?: Lesson | null;
  courseId?: string;
}

const LessonFormDialog = ({
  open,
  onOpenChange,
  moduleId,
  onLessonSaved,
  editingLesson,
  courseId
}: LessonFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMaterials, setUploadingMaterials] = useState(false);
  const [materialUrls, setMaterialUrls] = useState<string[]>([]);

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title || "");
      setDescription(editingLesson.description || "");
      setContentType(editingLesson.content_type || "video");
      setVideoUrl(editingLesson.video_url || "");
      setContent(JSON.stringify(editingLesson.content) !== '{}' ? JSON.stringify(editingLesson.content) : "");
      setMaterialUrls(editingLesson.materials_urls || []);
    } else {
      resetForm();
    }
  }, [editingLesson, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContentType("video");
    setVideoUrl("");
    setContent("");
    setMaterialUrls([]);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      toast.error('Video file size must be less than 500MB');
      return;
    }

    setUploadingVideo(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `lesson-video-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName);

      setVideoUrl(publicUrl);
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMaterials(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `lesson-material-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('course-materials')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('course-materials')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setMaterialUrls(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} material(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading materials:', error);
      toast.error('Failed to upload materials');
    } finally {
      setUploadingMaterials(false);
    }
  };

  const removeMaterial = (urlToRemove: string) => {
    setMaterialUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let lessonData;
      const lessonContent = content ? JSON.parse(content) : {};
      
      if (editingLesson) {
        lessonData = await updateLesson(editingLesson.id, {
          title,
          description: description || null,
          content_type: contentType,
          video_url: videoUrl || null,
          content: lessonContent,
          materials_urls: materialUrls
        });
        
        toast.success("Lesson updated successfully");
      } else {
        lessonData = await createLesson({
          module_id: moduleId,
          title,
          description: description || null,
          content_type: contentType,
          video_url: videoUrl || null,
          content: lessonContent,
          materials_urls: materialUrls,
          order_index: 0,
        });
        
        toast.success("Lesson created successfully");
      }
      
      if (lessonData) {
        onLessonSaved(lessonData);
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLesson ? "Edit Lesson" : "Create New Lesson"}
          </DialogTitle>
          <DialogDescription>
            {editingLesson 
              ? "Update the details of this lesson" 
              : "Add a new lesson to your module"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lesson description"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select 
              value={contentType} 
              onValueChange={setContentType}
            >
              <SelectTrigger id="contentType">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="mixed">Mixed Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(contentType === "video" || contentType === "mixed") && (
            <div className="space-y-2">
              <Label>Course Video</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="hidden"
                  id="video-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('video-upload')?.click()}
                  disabled={uploadingVideo}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingVideo ? 'Uploading Video...' : 'Upload Video'}
                </Button>
                {videoUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <File className="h-4 w-4" />
                    Video uploaded
                  </div>
                )}
              </div>
            </div>
          )}
          
          {(contentType === "text" || contentType === "mixed") && (
            <div className="space-y-2">
              <Label htmlFor="content">Lesson Content (JSON)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='{"blocks": [{"text": "Lesson content here"}]}'
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Enter lesson content as JSON. For advanced editing options, use a structured editor.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Course Materials & Assignments</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                onChange={handleMaterialUpload}
                disabled={uploadingMaterials}
                className="hidden"
                id="materials-upload"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('materials-upload')?.click()}
                disabled={uploadingMaterials}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingMaterials ? 'Uploading Materials...' : 'Upload Materials'}
              </Button>
            </div>
            
            {materialUrls.length > 0 && (
              <div className="space-y-2 mt-2">
                <Label className="text-sm font-medium">Uploaded Materials:</Label>
                {materialUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-600">
                      Material {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingVideo || uploadingMaterials}>
              {isSubmitting ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
