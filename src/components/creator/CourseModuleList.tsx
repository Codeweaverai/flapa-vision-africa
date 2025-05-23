
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface CourseModuleListProps {
  courseId: string;
  onModuleSelect?: (moduleId: string | null) => void;
  refreshTrigger?: number;
  editable?: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lesson_count?: number;
}

const CourseModuleList = ({ 
  courseId, 
  onModuleSelect,
  refreshTrigger = 0,
  editable = false
}: CourseModuleListProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        // Fetch modules with lesson count
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // Get lesson count for each module
        if (modulesData) {
          const modulesWithLessonCounts = await Promise.all(
            modulesData.map(async (module) => {
              const { count, error: countError } = await supabase
                .from('lessons')
                .select('id', { count: 'exact', head: true })
                .eq('module_id', module.id);

              if (countError) throw countError;

              return {
                ...module,
                lesson_count: count || 0
              };
            })
          );

          setModules(modulesWithLessonCounts);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast.error('Failed to load modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [courseId, refreshTrigger]);

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    try {
      // First check if module has lessons
      const { count, error: countError } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('module_id', moduleId);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        if (!confirm(`This module has ${count} lessons that will also be deleted. Continue?`)) {
          return;
        }
        
        // Delete lessons first
        const { error: lessonsError } = await supabase
          .from('lessons')
          .delete()
          .eq('module_id', moduleId);
          
        if (lessonsError) throw lessonsError;
      }
      
      // Then delete module
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);
        
      if (error) throw error;
      
      // Update UI
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Module deleted successfully');
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No modules available</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          {editable 
            ? "Get started by adding modules to organize your course content"
            : "This course doesn't have any modules yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module) => (
        <div 
          key={module.id} 
          className="p-4 border rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="text-sm bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                {module.order_index + 1}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-lg">{module.title}</h3>
                {module.description && (
                  <p className="text-muted-foreground text-sm mt-1">{module.description}</p>
                )}
                <div className="text-sm text-muted-foreground mt-2">
                  {module.lesson_count} lesson{module.lesson_count === 1 ? '' : 's'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {editable && (
                <>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteModule(module.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {onModuleSelect && (
                <Button variant="ghost" size="sm" onClick={() => onModuleSelect(module.id)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseModuleList;
