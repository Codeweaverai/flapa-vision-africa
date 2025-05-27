
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
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

  // Initialize form with lesson data if editing
  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title || "");
      setDescription(editingLesson.description || "");
      setContentType(editingLesson.content_type || "video");
      setVideoUrl(editingLesson.video_url || "");
      setContent(JSON.stringify(editingLesson.content) !== '{}' ? JSON.stringify(editingLesson.content) : "");
    } else {
      // Reset form when creating new lesson
      setTitle("");
      setDescription("");
      setContentType("video");
      setVideoUrl("");
      setContent("");
    }
  }, [editingLesson, open]);

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
        // Update existing lesson
        lessonData = await updateLesson(editingLesson.id, {
          title,
          description: description || null,
          content_type: contentType,
          video_url: videoUrl || null,
          content: lessonContent
        });
        
        toast.success("Lesson updated successfully");
      } else {
        // Create new lesson - need to get the next order index
        lessonData = await createLesson({
          module_id: moduleId,
          title,
          description: description || null,
          content_type: contentType,
          video_url: videoUrl || null,
          content: lessonContent,
          order_index: 0, // This will be set properly on the server
        });
        
        toast.success("Lesson created successfully");
      }
      
      if (lessonData) {
        onLessonSaved(lessonData);
        onOpenChange(false);
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
      <DialogContent className="sm:max-w-[600px]">
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
              <Label htmlFor="videoUrl">Video URL (YouTube, Vimeo, etc.)</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
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
          
          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
