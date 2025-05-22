
import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Play, Lock, Video, FileText } from 'lucide-react';
import { CourseModule, Lesson } from '@/services/courseService';

interface CourseModuleListProps {
  modules: CourseModule[];
  currentLessonId?: string;
  onSelectLesson: (lesson: Lesson) => void;
  isEnrolled: boolean;
}

const CourseModuleList: React.FC<CourseModuleListProps> = ({ 
  modules, 
  currentLessonId, 
  onSelectLesson,
  isEnrolled 
}) => {
  const [expandedModule, setExpandedModule] = useState<string | undefined>(
    // Initially expand the module containing the current lesson
    modules.find(module => 
      module.lessons.some(lesson => lesson.id === currentLessonId)
    )?.id || modules[0]?.id
  );
  
  const handleModuleClick = (moduleId: string) => {
    setExpandedModule(moduleId === expandedModule ? undefined : moduleId);
  };

  const calculateModuleProgress = (module: CourseModule): number => {
    if (!module.lessons.length) return 0;
    
    const completedLessons = module.lessons.filter(lesson => lesson.is_completed).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };
  
  const getLessonIcon = (lesson: Lesson, isActive: boolean) => {
    if (lesson.is_completed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (isActive) {
      return <Play className="h-4 w-4 text-primary" />;
    }

    if (lesson.content_type === 'video') {
      return <Video className="h-4 w-4 text-muted-foreground" />;
    }

    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };
  
  return (
    <div className="course-modules border rounded-md overflow-hidden">
      {modules.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          No modules available for this course yet
        </div>
      ) : (
        <Accordion 
          type="single" 
          collapsible 
          value={expandedModule}
          className="w-full"
        >
          {modules.map((module) => {
            const progress = calculateModuleProgress(module);
            
            return (
              <AccordionItem key={module.id} value={module.id} className="border-b">
                <AccordionTrigger 
                  onClick={() => handleModuleClick(module.id)}
                  className="px-4 py-3 hover:bg-accent/30 transition-all"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{module.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Progress value={progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="flex flex-col gap-1 py-1">
                    {module.lessons.map((lesson) => {
                      const isActive = lesson.id === currentLessonId;
                      return (
                        <Button
                          key={lesson.id}
                          variant={isActive ? "secondary" : "ghost"}
                          className={`justify-start h-auto py-2 px-4 ${isActive ? 'bg-secondary/30' : ''}`}
                          onClick={() => onSelectLesson(lesson)}
                          disabled={!isEnrolled}
                        >
                          <div className="flex items-start gap-2 w-full">
                            <div className="mt-0.5">
                              {isEnrolled ? (
                                getLessonIcon(lesson, isActive)
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">{lesson.title}</span>
                              {lesson.content_type === 'video' && (
                                <span className="text-xs text-muted-foreground">Video</span>
                              )}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default CourseModuleList;
