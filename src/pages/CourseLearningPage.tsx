import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Player } from '@vimeo/player';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Course, 
  Module, 
  Lesson, 
  fetchCourseById, 
  fetchCourseWithModulesAndLessons,
  saveLessonProgress
} from '@/services/courseService';

interface CourseLearningPageParams {
  courseId?: string;
  lessonId?: string;
}

const CourseLearningPage = () => {
  const { courseId, lessonId } = useParams<CourseLearningPageParams>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;

      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      setCourse(courseData);
      setLoading(false);
    };

    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (course && course.modules && course.modules.length > 0) {
      // Set initial module and lesson
      setCurrentModule(course.modules[0]);
      if (course.modules[0].lessons && course.modules[0].lessons.length > 0) {
        setCurrentLesson(course.modules[0].lessons[0]);
      }
    }
  }, [course]);

  useEffect(() => {
    if (currentLesson && currentLesson.video_url) {
      const newPlayer = new Player('vimeo-player', {
        id: parseInt(currentLesson.video_url.split('/').pop() || '0', 10),
        width: 640
      });

      setPlayer(newPlayer);

      newPlayer.on('timeupdate', (data) => {
        setProgress(data.percent);
      });

      return () => {
        newPlayer.destroy();
      };
    }
  }, [currentLesson]);

  const handleModuleChange = (module: Module) => {
    setCurrentModule(module);
    if (module.lessons && module.lessons.length > 0) {
      setCurrentLesson(module.lessons[0]);
    }
  };

  const handleLessonChange = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };

  const handleSaveProgress = async () => {
    if (!currentLesson || !user) return;

    try {
      // Assuming you have the enrollment ID available
      const enrollmentId = 'your_enrollment_id'; // Replace with actual enrollment ID
      await saveLessonProgress(currentLesson.id, enrollmentId, progress);
      toast.success("Progress saved!");
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex justify-center items-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="mb-6">The course you are looking for does not exist or has been removed.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <h1 className="text-3xl font-bold mb-4">{course.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-3">
            {currentLesson && currentLesson.video_url ? (
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <div id="vimeo-player"></div>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 mb-4">
                No video available for this lesson.
              </div>
            )}

            <div className="mb-4">
              <h2 className="text-xl font-semibold">{currentLesson?.title}</h2>
              <p>{currentLesson?.description}</p>
            </div>

            <button onClick={handleSaveProgress}>Save Progress</button>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="font-semibold mb-2">Modules</h3>
              <ul className="space-y-2">
                {course.modules?.map((module) => (
                  <li key={module.id}>
                    <button
                      className={`w-full text-left p-2 rounded-md hover:bg-primary/10 ${currentModule?.id === module.id ? 'bg-primary/20 font-semibold' : ''}`}
                      onClick={() => handleModuleChange(module)}
                    >
                      {module.title}
                    </button>
                  </li>
                ))}
              </ul>

              {currentModule && (
                <>
                  <h3 className="font-semibold mt-4 mb-2">Lessons</h3>
                  <ul className="space-y-2">
                    {currentModule.lessons?.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          className={`w-full text-left p-2 rounded-md hover:bg-primary/10 ${currentLesson?.id === lesson.id ? 'bg-primary/20 font-semibold' : ''}`}
                          onClick={() => handleLessonChange(lesson)}
                        >
                          {lesson.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
