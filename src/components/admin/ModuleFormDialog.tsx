import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CourseModule, createModule, updateModule } from "@/services/courseService";

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onModuleSaved: (module: CourseModule) => void;
  editingModule?: CourseModule | null;
  modules: CourseModule[];
}

const ModuleFormDialog = ({ 
  open, 
  onOpenChange, 
  courseId, 
  onModuleSaved, 
  editingModule, 
  modules 
}: ModuleFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingModule) {
      setTitle(editingModule.title);
      setDescription(editingModule.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [editingModule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Module title is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let moduleData;
      
      if (editingModule) {
        // Update existing module
        moduleData = await updateModule(editingModule.id, {
          title,
          description: description || null,
        });
        
        toast({
          title: "Module Updated",
          description: "The module has been updated successfully",
        });
      } else {
        // Create new module
        moduleData = await createModule({
          course_id: courseId,
          title,
          description: description || null,
          order_index: modules.length,
        });
        
        toast({
          title: "Module Created",
          description: "New module has been created successfully",
        });
      }
      
      if (moduleData) {
        onModuleSaved(moduleData);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving module:", error);
      toast({
        title: "Error",
        description: "Failed to save the module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingModule ? "Edit Module" : "Create New Module"}
          </DialogTitle>
          <DialogDescription>
            {editingModule 
              ? "Update the details of this module" 
              : "Add a new module to your course"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter module title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter module description"
              rows={4}
            />
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
                editingModule ? "Update Module" : "Create Module"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleFormDialog;
