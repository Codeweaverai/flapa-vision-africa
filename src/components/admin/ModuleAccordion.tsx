
import { useState } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Youtube,
  Clock, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Lesson, CourseModule, deleteModule, deleteLesson } from '@/services/courseService';

interface ModuleAccordionProps {
  modules: CourseModule[];
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddQuiz: (lessonId: string, moduleId: string) => void;
  onMoveUp: (moduleIndex: number) => void;
  onMoveDown: (moduleIndex: number) => void;
}

const ModuleAccordion = ({ 
  modules,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddQuiz,
  onMoveUp,
  onMoveDown
}: ModuleAccordionProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };
  
  return (
    <>
      <Accordion type="multiple" value={expandedModules} className="w-full">
        {modules.map((module, index) => (
          <AccordionItem key={module.id} value={module.id}>
            <div className="flex items-center border-b">
              <div className="flex-grow">
                <AccordionTrigger 
                  className="py-4 hover:no-underline"
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{module.title}</span>
                    {module.description && (
                      <span className="text-muted-foreground text-sm mt-1">{module.description}</span>
                    )}
                  </div>
                </AccordionTrigger>
              </div>
              
              <div className="flex gap-1 pr-4">
                {index > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(index);
                    }}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
                
                {index < modules.length - 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(index);
                    }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditModule(module);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModuleToDelete(module.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <AccordionContent>
              {/* Lessons Section */}
              <div className="pl-6 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Lessons</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAddLesson(module.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Lesson
                  </Button>
                </div>
                
                {/* Lessons List */}
                <div className="space-y-3">
                  {module.lessons && module.lessons.length > 0 ? (
                    module.lessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className="border rounded-md p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-grow">
                            <div className="font-medium">{lesson.title}</div>
                            
                            {lesson.description && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />
                                {lesson.description}
                              </div>
                            )}
                            
                            {lesson.video_url && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Youtube className="h-3.5 w-3.5" />
                                Has video
                              </div>
                            )}
                            
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              30 mins
                            </div>
                            
                            {(lesson.quizzes && lesson.quizzes.length > 0) ? (
                              <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm inline-flex items-center gap-1 mt-1">
                                Has quiz
                              </div>
                            ) : null}
                          </div>
                          
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditLesson(lesson)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {!(lesson.quizzes && lesson.quizzes.length > 0) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAddQuiz(lesson.id, module.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLessonToDelete(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed rounded-md">
                      <p className="text-muted-foreground">No lessons added yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onAddLesson(module.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Lesson
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {/* Delete Module Confirmation */}
      <AlertDialog open={!!moduleToDelete} onOpenChange={() => setModuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the module and all its lessons. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (moduleToDelete) {
                  onDeleteModule(moduleToDelete);
                  setModuleToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Lesson Confirmation */}
      <AlertDialog open={!!lessonToDelete} onOpenChange={() => setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lesson and its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (lessonToDelete) {
                  onDeleteLesson(lessonToDelete);
                  setLessonToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModuleAccordion;
