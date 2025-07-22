
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  Lock,
  Award,
  Users,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import LearningAIAssistant from '@/components/learning/LearningAIAssistant';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  price: number;
  instructor_id: string;
  is_published: boolean;
  created_at: string;
  modules: CourseModule[];
  lessons: Lesson[];
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url: string;
  transcript: string;
  order_index: number;
  is_preview: boolean;
  course_id: string;
  completion_status: 'complete' | 'incomplete';
}

interface Review {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  start_date: string;
  end_date: string | null;
  progress: number;
  is_completed: boolean;
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData(courseId, user.id);
    }
  }, [courseId, user]);

  const fetchCourseData = async (courseId: string, userId: string) => {
    setLoading(true);
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_modules (
            id,
            course_id,
            title,
            description,
            order_index
          ),
          lessons (
            id,
            module_id,
            title,
            description,
            video_url,
            content,
            order_index,
            duration_minutes
          ),
          course_reviews (
            id,
            course_id,
            user_id,
            rating,
            review_text,
            created_at
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      if (!courseData) {
        setCourse(null);
        setLoading(false);
        return;
      }

      // Fetch user's enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();

      if (enrollmentError) {
        console.error('Error fetching enrollment:', enrollmentError);
      }

      // Fetch completed lessons using lesson_progress table
      const { data: completedLessonsData, error: completedLessonsError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollmentData?.id)
        .eq('is_completed', true);

      if (completedLessonsError) {
        console.error('Error fetching completed lessons:', completedLessonsError);
      }

      // Calculate average rating and total reviews
      const reviews = courseData.course_reviews || [];
      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      // Transform the data to match Course interface
      const transformedCourseData = {
        ...courseData,
        image_url: courseData.thumbnail_url || '',
        instructor_id: courseData.creator_id || '',
        modules: courseData.course_modules?.map((module: any) => ({
          ...module,
          lessons: courseData.lessons?.filter((lesson: any) => lesson.module_id === module.id) || []
        })) || [],
        lessons: courseData.lessons || [],
        reviews: reviews.map((review: any) => ({
          ...review,
          comment: review.review_text || ''
        })),
        averageRating: averageRating,
        totalReviews: reviews.length
      };

      setCourse(transformedCourseData as Course);
      setEnrollment(enrollmentData as Enrollment || null);
      setCompletedLessons((completedLessonsData || []).map(item => item.lesson_id));

      // Set initial current lesson
      const firstLesson = (transformedCourseData as Course).modules[0]?.lessons[0];
      setCurrentLesson(firstLesson || null);

      // Calculate and set progress
      const totalLessons = transformedCourseData.lessons.length;
      const completedCount = (completedLessonsData || []).length;
      const calculatedProgress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
      setProgress(calculatedProgress);

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !enrollment) {
      toast.error('Please sign in to mark lesson as complete');
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
            is_completed: true,
            completion_date: new Date().toISOString()
          },
          { onConflict: 'enrollment_id, lesson_id', ignoreDuplicates: false }
        );

      if (error) throw error;

      setCompletedLessons(prev => [...prev, lessonId]);

      // Recalculate progress
      const totalLessons = course?.lessons.length || 0;
      const completedCount = completedLessons.length + 1;
      const calculatedProgress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
      setProgress(calculatedProgress);

      toast.success('Lesson marked as complete');
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : !course ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Course not found</h1>
              <Button onClick={() => navigate('/my-courses')}>
                Back to My Courses
              </Button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Course Header */}
              <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{course.title}</CardTitle>
                  <p className="text-gray-600">{course.description}</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 font-medium">Category: {course.category}</p>
                    <p className="text-gray-700">Instructor: {course.instructor_id}</p>
                  </div>
                  <div className="flex items-center justify-start md:justify-end">
                    <Badge variant="outline" className="mr-2">
                      <Users className="w-4 h-4 mr-1" />
                      {course.totalReviews} Reviews
                    </Badge>
                    <Badge variant="outline">
                      <Star className="w-4 h-4 mr-1" />
                      {course.averageRating.toFixed(1)} Rating
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Course Progress */}
              <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Course Progress</CardTitle>
                  <p className="text-gray-600">Track your learning journey</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-700">Completed: {completedLessons.length} / {course.lessons.length} lessons</p>
                    <p className="text-gray-700 font-medium">{progress.toFixed(1)}%</p>
                  </div>
                  <Progress value={progress} />
                </CardContent>
              </Card>

              {/* Course Tabs */}
              <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="content">
                    <Play className="w-4 h-4 mr-2" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="reviews">
                    <Award className="w-4 h-4 mr-2" />
                    Reviews
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle>Course Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{course.description}</p>
                      <div className="mt-4">
                        <h3 className="text-xl font-bold mb-2">What you'll learn</h3>
                        <ul className="list-disc list-inside text-gray-700">
                          <li>Understand the fundamentals of the topic</li>
                          <li>Apply your knowledge through practical exercises</li>
                          <li>Build real-world projects</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="content" className="mt-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle>Course Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {course.modules.map((module) => (
                        <div key={module.id} className="mb-6">
                          <h2 className="text-xl font-bold mb-2">{module.title}</h2>
                          <p className="text-gray-600 mb-4">{module.description}</p>
                          <ul>
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => handleLessonClick(lesson)}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    {lesson.title}
                                  </Button>
                                  {completedLessons.includes(lesson.id) ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                {!enrollment && !lesson.is_preview ? (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="reviews" className="mt-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle>Course Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {course.reviews.length === 0 ? (
                        <p className="text-gray-600">No reviews yet.</p>
                      ) : (
                        course.reviews.map((review) => (
                          <div key={review.id} className="mb-4 p-4 border border-gray-200 rounded-md">
                            <div className="flex items-center mb-2">
                              <Award className="w-4 h-4 mr-2" />
                              <p className="font-bold">Rating: {review.rating}</p>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Current Lesson */}
              {currentLesson && (
                <Card className="mt-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>{currentLesson.title}</CardTitle>
                    <p className="text-gray-600">{currentLesson.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <iframe
                        src={currentLesson.video_url}
                        title="Course Lesson"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2">Transcript</h3>
                      <p className="text-gray-700">{currentLesson.transcript}</p>
                    </div>
                    {enrollment && !completedLessons.includes(currentLesson.id) && (
                      <Button onClick={() => markLessonComplete(currentLesson.id)}>
                        Mark as Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        
        {/* Learning AI Assistant */}
        {course && <LearningAIAssistant courseId={course.id} courseName={course.title} />}
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
