
import React, { useState, useEffect } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video,
  HelpCircle,
  Award,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  video_url?: string;
  order_index: number;
  quizzes?: Quiz[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface FinalExam {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes: number;
  course_id: string;
}

interface CreatorProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface EnhancedCourseModuleListProps {
  modules: Module[];
  courseId: string;
  creatorId?: string;
  onLessonSelect: (lesson: Lesson) => void;
  currentLessonId?: string;
  completedLessons?: string[];
  onQuizStart?: (quizId: string, lessonId: string) => void;
  onFinalExamStart?: (examId: string) => void;
}

const EnhancedCourseModuleList: React.FC<EnhancedCourseModuleListProps> = ({
  modules,
  courseId,
  creatorId,
  onLessonSelect,
  currentLessonId,
  completedLessons = [],
  onQuizStart,
  onFinalExamStart
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchFinalExam();
    }
    if (creatorId) {
      fetchCreatorProfile();
    }
  }, [courseId, creatorId]);

  useEffect(() => {
    calculateProgress();
  }, [modules, completedLessons]);

  const fetchFinalExam = async () => {
    try {
      const { data, error } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setFinalExam(data);
    } catch (error) {
      console.error('Error fetching final exam:', error);
    }
  };

  const fetchCreatorProfile = async () => {
    if (!creatorId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      setCreatorProfile(data);
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const calculateProgress = () => {
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
    if (totalLessons === 0) {
      setCourseProgress(0);
      return;
    }
    const progress = (completedLessons.length / totalLessons) * 100;
    setCourseProgress(Math.round(progress));
  };

  const getCurrentLessonPosition = () => {
    if (!currentLessonId) return null;
    
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(lesson => lesson.id === currentLessonId);
      if (lessonIndex !== -1) {
        return { moduleIndex, lessonIndex };
      }
    }
    return null;
  };

  const getNextLesson = () => {
    const position = getCurrentLessonPosition();
    if (!position) return null;
    
    const { moduleIndex, lessonIndex } = position;
    const currentModule = modules[moduleIndex];
    
    // Check if there's a next lesson in current module
    if (lessonIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[lessonIndex + 1];
    }
    
    // Check if there's a next module
    if (moduleIndex < modules.length - 1) {
      const nextModule = modules[moduleIndex + 1];
      if (nextModule.lessons.length > 0) {
        return nextModule.lessons[0];
      }
    }
    
    return null;
  };

  const getPreviousLesson = () => {
    const position = getCurrentLessonPosition();
    if (!position) return null;
    
    const { moduleIndex, lessonIndex } = position;
    
    // Check if there's a previous lesson in current module
    if (lessonIndex > 0) {
      return modules[moduleIndex].lessons[lessonIndex - 1];
    }
    
    // Check if there's a previous module
    if (moduleIndex > 0) {
      const previousModule = modules[moduleIndex - 1];
      if (previousModule.lessons.length > 0) {
        return previousModule.lessons[previousModule.lessons.length - 1];
      }
    }
    
    return null;
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) return;
    
    try {
      // Find enrollment
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) return;

      // Mark lesson as complete
      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
          completion_date: new Date().toISOString()
        });

      // Update course progress
      const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
      const newCompletedCount = completedLessons.length + 1;
      const newProgress = Math.round((newCompletedCount / totalLessons) * 100);

      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: newProgress,
          last_lesson_completed: lessonId
        });

    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const handleNextLesson = async () => {
    const nextLesson = getNextLesson();
    if (!nextLesson || isNavigating) return;
    
    setIsNavigating(true);
    
    // Mark current lesson as complete if not already
    if (currentLessonId && !completedLessons.includes(currentLessonId)) {
      await markLessonComplete(currentLessonId);
    }
    
    onLessonSelect(nextLesson);
    setIsNavigating(false);
  };

  const handlePreviousLesson = () => {
    const previousLesson = getPreviousLesson();
    if (!previousLesson || isNavigating) return;
    
    onLessonSelect(previousLesson);
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

   return (
    <div className="space-y-4 w-full max-w-md mx-auto px-2 sm:px-0">
      {/* Course Progress - Mobile Optimized */}
      <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm sm:text-base font-medium text-gray-800">Course Progress</span>
          <span className="text-xs sm:text-sm font-bold text-orange-600">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-1.5 sm:h-2" />
      </div>

      {/* Navigation Controls - Stacked on mobile */}
      {currentLessonId && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousLesson}
            disabled={!getPreviousLesson() || isNavigating}
            className="px-3 w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            size="sm"
            onClick={handleNextLesson}
            disabled={!getNextLesson() || isNavigating}
            className="px-3 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Modules - Mobile Optimized */}
      <Accordion 
        type="multiple" 
        value={openModules}
        onValueChange={setOpenModules}
        className="space-y-2"
      >
        {modules.map((module) => (
          <AccordionItem 
            key={module.id} 
            value={module.id}
            className="border rounded-lg bg-gradient-to-r from-orange-50 to-purple-50"
          >
            <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 text-left">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  <span className="text-sm sm:text-base font-medium">{module.title}</span>
                  <Badge variant="outline" className="bg-white text-xs">
                    {module.lessons?.length || 0} lessons
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {module.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {module.description}
                </p>
              )}
              
              {module.lessons && module.lessons.length > 0 ? (
                <div className="space-y-2">
                  {module.lessons.map((lesson, index) => (
                    <div key={lesson.id}>
                      <div 
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                          currentLessonId === lesson.id 
                            ? 'bg-gradient-to-r from-orange-100 to-purple-100 border-orange-300 shadow-sm' 
                            : 'hover:bg-gray-50 hover:shadow-sm'
                        }`}
                        onClick={() => onLessonSelect(lesson)}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">{index + 1}</span>
                              </div>
                            )}
                            {lesson.content_type === 'video' ? (
                              <Video className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-medium truncate">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={currentLessonId === lesson.id ? "default" : "outline"}
                          size="sm"
                          className={`mt-2 sm:mt-0 w-full sm:w-auto ${
                            currentLessonId === lesson.id ? 
                              "bg-gradient-to-r from-orange-500 to-purple-600" : ""
                          }`}
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {currentLessonId === lesson.id ? 'Watching' : 'Watch'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-xs sm:text-sm text-muted-foreground">
                  No lessons available in this module
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Final Exam - Mobile Optimized */}
      {finalExam && courseProgress >= 80 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-orange-800">{finalExam.title}</h4>
                {finalExam.description && (
                  <p className="text-xs sm:text-sm text-orange-600 mt-1 line-clamp-2">{finalExam.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <Badge variant="outline" className="text-xs sm:text-sm text-orange-700 border-orange-300">
                    {finalExam.passing_score}% to pass
                  </Badge>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {finalExam.time_limit_minutes} mins
                  </div>
                </div>
              </div>
            </div>
            <Button 
              className="w-full sm:w-auto mt-2 sm:mt-0 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              onClick={() => onFinalExamStart?.(finalExam.id)}
            >
              <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Take Exam
            </Button>
          </div>
        </div>
      )}

      {/* Course Results Button - Mobile Optimized */}
      {courseProgress === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-green-800">Course Completed!</h4>
                <p className="text-xs sm:text-sm text-green-600 mt-1">View your final results and certificate</p>
              </div>
            </div>
            <Button 
              className="w-full sm:w-auto mt-2 sm:mt-0 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              onClick={() => navigate(`/course/${courseId}/results`)}
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              View Results
            </Button>
          </div>
        </div>
      )}

      {/* Creator Profile - Mobile Optimized */}
      {creatorProfile && (
        <div className="bg-gradient-to-r from-orange-50 to-purple-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={creatorProfile.avatar_url || undefined} />
                <AvatarFallback>
                  {creatorProfile.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-orange-800">Your Instructor</h4>
                <p className="text-xs sm:text-sm font-medium text-orange-700 truncate">{creatorProfile.full_name}</p>
                {creatorProfile.bio && (
                  <p className="text-xs text-orange-600 mt-1 line-clamp-2">{creatorProfile.bio}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="w-full sm:w-auto mt-2 sm:mt-0 border-orange-300 text-orange-600 hover:bg-orange-100"
              onClick={() => navigate(`/creator/profile/${creatorProfile.id}`)}
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              View Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCourseModuleList;
