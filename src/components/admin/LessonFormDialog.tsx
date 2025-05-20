import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { createLesson, updateLesson } from "@/services/courseService";
import { Lesson } from "@/services/courseService";

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  onLessonSaved: (lesson: Lesson) => void;
  editingLesson?: Lesson | null;
  lessons: Lesson[];
  courseId: string;
}

const LessonFormDialog = ({
  open,
  onOpenChange,
  moduleId,
  onLessonSaved,
  editingLesson,
  lessons,
  courseId
}: LessonFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [addQuiz, setAddQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title);
      setDescription(editingLesson.description || "");
      setVideoUrl(editingLesson.video_url || "");
      // We would set estimated minutes here if it was in the database
    } else {
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setEstimatedMinutes("30");
      setAddQuiz(false);
    }
  }, [editingLesson, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Lesson title is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const lessonData = {
        module_id: moduleId,
        title,
        description: description || null,
        video_url: videoUrl || null,
        order_index: editingLesson ? editingLesson.order_index : lessons.length,
        content_type: 'video' as const, // Default content type
        content: {} // Default empty content
      };
      
      let savedLesson;
      
      if (editingLesson) {
        // Update existing lesson
        savedLesson = await updateLesson(editingLesson.id, lessonData);
        
        toast({
          title: "Lesson Updated",
          description: "The lesson has been updated successfully",
        });
      } else {
        // Create new lesson
        savedLesson = await createLesson(lessonData);
        
        toast({
          title: "Lesson Created",
          description: "New lesson has been created successfully",
        });
        
        // If add quiz was toggled, we would handle quiz creation here
        if (addQuiz) {
          // This would be implemented in the next step
          toast({
            title: "Quiz Creation",
            description: "You can now add a quiz for this lesson",
          });
        }
      }
      
      if (savedLesson) {
        onLessonSaved(savedLesson);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: "Failed to save the lesson. Please try again.",
        variant: "destructive",
      });
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lesson description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="videoUrl">YouTube Video URL</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">
              Enter the full YouTube URL for the lesson video
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedMinutes">Estimated Completion Time (minutes)</Label>
            <Input
              id="estimatedMinutes"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              min="1"
              max="300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="addQuiz"
              checked={addQuiz}
              onCheckedChange={setAddQuiz}
            />
            <Label htmlFor="addQuiz">Add Quiz to this Lesson</Label>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 
                "Saving..." : 
                editingLesson ? "Update Lesson" : "Create Lesson"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
