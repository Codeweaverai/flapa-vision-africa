
import React, { useState } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video,
  HelpCircle
} from 'lucide-react';
import { CourseModule, Lesson } from '@/services/courseService';

interface CourseModuleListProps {
  modules: CourseModule[];
  onLessonSelect: (lesson: Lesson) => void;
  currentLessonId?: string;
  completedLessons?: string[];
  onQuizStart?: (quizId: string) => void;
}

const CourseModuleList: React.FC<CourseModuleListProps> = ({
  modules,
  onLessonSelect,
  currentLessonId,
  completedLessons = [],
  onQuizStart
}) => {
  const [openModules, setOpenModules] = useState<string[]>([]);

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-4">
      <Accordion 
        type="multiple" 
        value={openModules}
        onValueChange={setOpenModules}
        className="space-y-4"
      >
        {modules.map((module) => (
          <AccordionItem 
            key={module.id} 
            value={module.id}
            className="border rounded-lg"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 text-left">
                  <span className="font-medium">{module.title}</span>
                  <Badge variant="outline">
                    {module.lessons?.length || 0} lessons
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {module.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
              )}
              
              {module.lessons && module.lessons.length > 0 ? (
                <div className="space-y-2">
                  {module.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="space-y-2">
                      <div 
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          currentLessonId === lesson.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => onLessonSelect(lesson)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">{index + 1}</span>
                              </div>
                            )}
                            {lesson.content_type === 'video' ? (
                              <Video className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {lesson.content?.duration && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(lesson.content.duration)}
                            </div>
                          )}
                          <Button
                            variant={currentLessonId === lesson.id ? "default" : "outline"}
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            {currentLessonId === lesson.id ? 'Watching' : 'Watch'}
                          </Button>
                        </div>
                      </div>

                      {/* Show quizzes for this lesson */}
                      {lesson.quizzes && lesson.quizzes.length > 0 && (
                        <div className="ml-8 space-y-2">
                          {lesson.quizzes.map((quiz) => (
                            <div 
                              key={quiz.id}
                              className="flex items-center justify-between p-2 border border-orange-200 rounded bg-orange-50"
                            >
                              <div className="flex items-center space-x-2">
                                <HelpCircle className="h-4 w-4 text-orange-500" />
                                <div>
                                  <span className="text-sm font-medium">{quiz.title}</span>
                                  {quiz.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {quiz.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-orange-600">
                                    Passing Score: {quiz.passing_score}%
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuizStart?.(quiz.id);
                                }}
                              >
                                <HelpCircle className="h-4 w-4 mr-1" />
                                Take Quiz
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No lessons available in this module
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default CourseModuleList;
