import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { SimplifiedCourse, SimplifiedModule, SimplifiedLesson } from '@/types/eventTypes';

// Use explicit non-recursive interface definitions
interface SimplifiedLesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  module_id: string;
  order_index: number;
  content_type?: string;
  content?: any;
  is_completed?: boolean;
}

interface SimplifiedModule {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  order_index: number;
  lessons: SimplifiedLesson[];
}

interface SimplifiedCourse {
  id: string;
  title: string;
  description: string;
  modules: SimplifiedModule[];
}

interface LessonProgress {
  position: number;
  completed: boolean;
}

const CoursePlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<SimplifiedCourse | null>(null);
  const [currentLesson, setCurrentLesson] = useState<SimplifiedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('User not authenticated');
        }
        
        const { course, enrollmentId } = await fetchAndFormatCourseData(courseId, user.user.id);
        setCourse(course);
        setEnrollmentId(enrollmentId);
        
        // Set initial lesson
        if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
          setCurrentLesson(course.modules[0].lessons[0]);
        }
      } catch (error: any) {
        console.error("Error loading course:", error);
        toast.error(error.message || "Failed to load course data");
        navigate('/learning');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, navigate]);

  useEffect(() => {
    if (videoRef.current && currentLesson?.video_url) {
      setVideoLoading(true);
      videoRef.current.src = currentLesson.video_url;
      videoRef.current.load();
    }
  }, [currentLesson]);

  const handleLessonChange = (lesson: SimplifiedLesson) => {
    setCurrentLesson(lesson);
  };

  const handleVideoLoaded = () => {
    setVideoLoading(false);
  };

  const handleVideoError = () => {
    setVideoLoading(false);
    toast.error("Failed to load video");
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && enrollmentId && currentLesson) {
      const position = videoRef.current.currentTime;
      const completed = videoRef.current.currentTime >= videoRef.current.duration * 0.95; // Consider completed at 95%
      
      saveLessonProgress(currentLesson.id, enrollmentId, { position, completed });
    }
  };

  const handleVideoEnded = async () => {
    if (videoRef.current && enrollmentId && currentLesson) {
      await saveLessonProgress(currentLesson.id, enrollmentId, { position: videoRef.current.duration, completed: true });
      
      // Mark lesson as completed in state
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;
        
        const updatedModules = prevCourse.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson =>
            lesson.id === currentLesson.id ? { ...lesson, is_completed: true } : lesson
          )
        }));
        
        return { ...prevCourse, modules: updatedModules };
      });
    }
  };

  const fetchAndFormatCourseData = async (courseId: string, userId: string) => {
    try {
      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();
        
      if (courseError) throw courseError;
      
      // Fetch enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();
        
      if (enrollmentError) {
        console.error('No enrollment found:', enrollmentError);
        throw new Error('You are not enrolled in this course');
      }
      
      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('id, title, description, course_id, order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
        
      if (modulesError) throw modulesError;
      
      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, video_url, module_id, order_index')
        .in('module_id', modulesData.map(m => m.id))
        .order('order_index', { ascending: true });
        
      if (lessonsError) throw lessonsError;
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed, last_position_seconds')
        .eq('enrollment_id', enrollmentData.id);
        
      if (progressError) {
        console.error('Error fetching lesson progress:', progressError);
      }
      
      // Format modules and lessons with explicit type casting
      const modules = modulesData.map((moduleItem) => {
        const moduleLessons = lessonsData
          .filter((lessonItem) => lessonItem.module_id === moduleItem.id)
          .sort((a, b) => a.order_index - b.order_index)
          .map((lessonItem) => {
            // Create a new object with the correct type
            const lesson: SimplifiedLesson = {
              id: lessonItem.id,
              title: lessonItem.title,
              description: lessonItem.description,
              video_url: lessonItem.video_url,
              module_id: lessonItem.module_id,
              order_index: lessonItem.order_index,
              content_type: lessonItem.video_url ? 'video' : 'quiz',
              content: lessonItem.video_url ? null : { questions: [], pass_percentage: 70 },
              is_completed: progressData?.some(p => p.lesson_id === lessonItem.id && p.is_completed) || false
            };
            return lesson;
          });
        
        // Create a new module object with the correct type
        const moduleObj: SimplifiedModule = {
          id: moduleItem.id,
          title: moduleItem.title,
          description: moduleItem.description,
          course_id: moduleItem.course_id,
          order_index: moduleItem.order_index,
          lessons: moduleLessons
        };
        
        return moduleObj;
      });
      
      // Create the final course object with the correct type
      const course: SimplifiedCourse = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        modules: modules
      };
      
      return {
        course,
        enrollmentId: enrollmentData.id
      };
    } catch (error) {
      console.error('Error in fetchAndFormatCourseData:', error);
      throw error;
    }
  };

  const saveLessonProgress = async (lessonId: string, enrollmentId: string, progress: LessonProgress): Promise<boolean> => {
    try {
      // Check if progress record exists
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId)
        .single();
        
      if (existing) {
        // Update existing progress
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            last_position_seconds: progress.position || 0,
            is_completed: progress.completed || false,
            completion_date: progress.completed ? new Date().toISOString() : null
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('lesson_progress')
          .insert({
            lesson_id: lessonId,
            enrollment_id: enrollmentId,
            last_position_seconds: progress.position || 0,
            is_completed: progress.completed || false,
            completion_date: progress.completed ? new Date().toISOString() : null
          });
          
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving lesson progress:', error);
      return false;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found.</div>;
  }

  return (
    <div className="course-player-container">
      <h1>{course.title}</h1>
      <div className="video-player">
        {videoLoading ? (
          <div>Loading video...</div>
        ) : null}
        <video
          ref={videoRef}
          controls
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          style={{ width: '100%', maxWidth: '800px' }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="course-content">
        {course.modules.map((module) => (
          <div key={module.id} className="module">
            <h2>{module.title}</h2>
            <ul>
              {module.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <button onClick={() => handleLessonChange(lesson)}>
                    {lesson.title} - {lesson.is_completed ? 'Completed' : 'Not Completed'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursePlayerPage;
