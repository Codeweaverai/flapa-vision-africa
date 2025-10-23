import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, BookOpen } from "lucide-react";
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

  const GradientButton = ({ children, ...props }: any) => (
    <Button
      {...props}
      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {children}
    </Button>
  );

  const GradientIcon = () => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
      <BookOpen className="h-5 w-5 text-white" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <GradientIcon />
            <DialogTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent text-2xl font-bold">
              {editingModule ? "Edit Module" : "Create New Module"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-lg text-gray-600">
            {editingModule 
              ? "Update the details of this module" 
              : "Add a new module to organize your course content"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                    Module Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive module title..."
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what students will learn in this module..."
                    rows={4}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DialogFooter className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <GradientButton 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingModule ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {editingModule ? 'Update Module' : 'Create Module'}
                </>
              )}
            </GradientButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
 
export default ModuleFormDialog;
