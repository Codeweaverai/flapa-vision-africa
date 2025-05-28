
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleId: string;
  lesson?: {
    id: string;
    title: string;
    description: string;
    content_type: string;
    video_url: string;
    order_index: number;
    materials_urls?: string[];
  };
}

const LessonFormDialog: React.FC<LessonFormProps> = ({ 
  isOpen, onClose, onSuccess, moduleId, lesson 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMaterials, setUploadingMaterials] = useState(false);
  const [materialUrls, setMaterialUrls] = useState<string[]>([]);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setContentType(lesson.content_type || 'video');
      setVideoUrl(lesson.video_url || '');
      setOrderIndex(lesson.order_index);
      setMaterialUrls(lesson.materials_urls || []);
    } else {
      resetForm();
    }
  }, [lesson, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContentType('video');
    setVideoUrl('');
    setOrderIndex(0);
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
    setIsSaving(true);

    try {
      if (lesson) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title,
            description,
            content_type: contentType,
            video_url: videoUrl,
            materials_urls: materialUrls,
            updated_at: new Date().toISOString()
          })
          .eq('id', lesson.id);

        if (error) throw error;
        toast.success('Lesson updated successfully');
      } else {
        // Determine the next order index if not provided
        let nextOrderIndex = orderIndex;
        if (nextOrderIndex === 0) {
          const { data, error } = await supabase
            .from('lessons')
            .select('order_index')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: false })
            .limit(1);

          if (error) throw error;
          nextOrderIndex = data && data.length > 0 ? data[0].order_index + 1 : 1;
        }

        // Create new lesson
        const { error } = await supabase
          .from('lessons')
          .insert({
            module_id: moduleId,
            title,
            description,
            content_type: contentType,
            video_url: videoUrl,
            materials_urls: materialUrls,
            order_index: nextOrderIndex
          });

        if (error) throw error;
        toast.success('Lesson created successfully');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{lesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
            <DialogDescription>
              {lesson ? 'Update the lesson details below.' : 'Add a new lesson to this module.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content_type">Content Type</Label>
              <Select 
                value={contentType} 
                onValueChange={setContentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {contentType === 'video' && (
              <div className="grid gap-2">
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

            <div className="grid gap-2">
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
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || uploadingVideo || uploadingMaterials}>
              {isSaving ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
