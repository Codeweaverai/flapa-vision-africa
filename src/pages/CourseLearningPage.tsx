// Import necessary dependencies
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Play, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { 
  fetchCourseWithModulesAndLessons, 
  checkEnrollmentStatus, 
  saveLessonProgress
} from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourseContent = async () => {
      if (!courseId) return;
      
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
    };
    
    loadCourseContent();
  }, [courseId]);

  useEffect(() => {
    const checkAccess = async () => {
      if (user && courseId) {
        const enrolled = await checkEnrollmentStatus(courseId, user);
        if (!enrolled) {
          toast.error('You are not enrolled in this course');
          navigate(`/course/${courseId}`);
        }
      } else if (!user) {
        toast.error('Please log in to access this course');
        navigate('/auth');
      }
    };
    
    checkAccess();
  }, [courseId, user, navigate]);

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <p>Loading course content...</p>
        </div>
      </Layout>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons?.[currentLessonIndex];

  // Mark lesson as completed
  const markLessonAsCompleted = async (lessonId: string) => {
    if (!user) return;
    
    try {
      // For the lesson progress function, convert true/false to boolean
      await saveLessonProgress(lessonId, 'enrollment-id', true);
      
      // Update local state
      setCompletedLessons(prev => [...prev, lessonId]);
      toast.success('Lesson marked as completed');
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      toast.error('Failed to mark lesson as completed');
    }
  };

  const goToNextLesson = () => {
    if (!currentModule) return;
    
    const lessons = currentModule.lessons || [];
    
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    } else {
      toast.info('You have completed the course!');
    }
  };
  
  const handleLessonProgress = async (lessonId: string, progressSeconds: number) => {
    if (!user) return;
    
    try {
      // For the lesson progress function, convert to boolean for completion status
      await saveLessonProgress(lessonId, 'enrollment-id', false, progressSeconds);
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <Link to={`/course/${courseId}`} className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
          </Link>
          <h1 className="text-2xl font-bold mt-4">{course.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Course Content Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Course Content</h2>
                <ul>
                  {course.modules.map((module, moduleIndex) => (
                    <li key={module.id} className="mb-4">
                      <div className="font-semibold">{module.title}</div>
                      <ul>
                        {module.lessons?.map((lesson, lessonIndex) => (
                          <li
                            key={lesson.id}
                            className={`flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-100 cursor-pointer ${
                              currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex
                                ? 'bg-gray-100'
                                : ''
                            }`}
                            onClick={() => {
                              setCurrentModuleIndex(moduleIndex);
                              setCurrentLessonIndex(lessonIndex);
                            }}
                          >
                            <div className="flex items-center">
                              {completedLessons.includes(lesson.id) ? (
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="mr-2 h-4 w-4 text-gray-400" />
                              )}
                              {lesson.title}
                            </div>
                            <Play className="h-4 w-4 text-gray-500" />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content */}
          <div className="md:col-span-2">
            {currentLesson ? (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{currentLesson.title}</h2>
                  {/* Placeholder for video player or lesson content */}
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-md mb-4">
                    <iframe
                      src={currentLesson.video_url}
                      title="Course Lesson"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p>{currentLesson.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Button onClick={() => markLessonAsCompleted(currentLesson.id)}>
                      Mark as Completed
                    </Button>
                    <Button onClick={goToNextLesson}>Next Lesson</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p>No lesson selected. Please choose a lesson from the sidebar.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
