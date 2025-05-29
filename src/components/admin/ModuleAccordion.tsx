
import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Video, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { CourseModule, Lesson } from '@/services/courseService';

interface ModuleAccordionProps {
  modules: CourseModule[];
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddQuiz: (lessonId: string, moduleId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const ModuleAccordion: React.FC<ModuleAccordionProps> = ({
  modules,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddQuiz,
  onMoveUp,
  onMoveDown
}) => {
  return (
    <Accordion type="multiple" className="space-y-4">
      {modules.map((module, moduleIndex) => (
        <AccordionItem 
          key={module.id} 
          value={module.id}
          className="border rounded-lg"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <span className="font-medium">{module.title}</span>
                <Badge variant="outline">
                  {module.lessons?.length || 0} lesson(s)
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(moduleIndex);
                  }}
                  disabled={moduleIndex === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(moduleIndex);
                  }}
                  disabled={moduleIndex === modules.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditModule(module);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteModule(module.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {module.description && (
                <p className="text-sm text-muted-foreground">{module.description}</p>
              )}
              
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Lessons</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddLesson(module.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>

              {module.lessons && module.lessons.length > 0 ? (
                <div className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <div 
                      key={lesson.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        {lesson.content_type === 'video' ? (
                          <Video className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <span className="font-medium">{lesson.title}</span>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {lesson.description}
                            </p>
                          )}
                          {lesson.quizzes && lesson.quizzes.length > 0 && (
                            <div className="flex items-center space-x-2 mt-2">
                              <HelpCircle className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-orange-600">
                                {lesson.quizzes.length} quiz(es) attached
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddQuiz(lesson.id, module.id)}
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Quiz
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditLesson(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">No lessons in this module yet</p>
                  <Button
                    variant="outline"
                    onClick={() => onAddLesson(module.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Lesson
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ModuleAccordion;
