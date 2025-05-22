
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import VideoUpload from '@/components/creator/VideoUpload';

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
  const [videoMetadata, setVideoMetadata] = useState<any | null>(null);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setContentType(lesson.content_type || 'video');
      setVideoUrl(lesson.video_url || '');
      setOrderIndex(lesson.order_index);
    } else {
      resetForm();
    }
  }, [lesson, isOpen]);

  useEffect(() => {
    // If there's a lesson ID, try to load video metadata
    const fetchVideoMetadata = async () => {
      if (lesson?.id) {
        try {
          const { data, error } = await supabase
            .from('video_metadata')
            .select('*')
            .eq('lesson_id', lesson.id)
            .single();
          
          if (data && !error) {
            setVideoMetadata(data);
            setVideoUrl(data.wasabi_url);
          }
        } catch (error) {
          console.error('Error fetching video metadata:', error);
        }
      }
    };
    
    fetchVideoMetadata();
  }, [lesson?.id]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContentType('video');
    setVideoUrl('');
    setOrderIndex(0);
    setVideoMetadata(null);
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
        const { data, error } = await supabase
          .from('lessons')
          .insert({
            module_id: moduleId,
            title,
            description,
            content_type: contentType,
            video_url: videoUrl,
            order_index: nextOrderIndex
          })
          .select();

        if (error) throw error;
        
        // Update video metadata with lesson ID if we have it
        if (videoMetadata && data && data.length > 0) {
          await supabase
            .from('video_metadata')
            .update({ lesson_id: data[0].id })
            .eq('id', videoMetadata.id);
        }
        
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

  const handleVideoUpload = (videoData: {
    url: string;
    path: string;
    metadata: any;
  }) => {
    setVideoUrl(videoData.url);
    setVideoMetadata(videoData.metadata);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
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
                <Label>Video Upload</Label>
                <VideoUpload 
                  lessonId={lesson?.id || 'temp-' + new Date().getTime()}
                  currentVideoUrl={videoUrl}
                  onUploadComplete={handleVideoUpload}
                />
              </div>
            )}
            
            {contentType === 'text' && (
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  rows={10}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
