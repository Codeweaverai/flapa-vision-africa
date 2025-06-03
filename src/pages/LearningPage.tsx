
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { BookOpen, Clock, Play, Award, Users, Star } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  certificate_enabled: boolean;
  creator_id: string;
}

interface CourseProgress {
  id: string;
  course_id: string;
  user_id: string;
  last_lesson_completed: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

const LearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      setLoading(true);
      try {
        // Fetch course enrollments for the user
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', user.id);

        if (enrollmentsError) throw enrollmentsError;

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(enrollment => enrollment.course_id);

          // Fetch the enrolled courses
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);

          if (coursesError) throw coursesError;

          setEnrolledCourses(courses || []);

          // Fetch course progress for the user
          const { data: progressData, error: progressError } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('course_id', courseIds);

          if (progressError) throw progressError;

          setCourseProgress(progressData || []);
        } else {
          setEnrolledCourses([]);
          setCourseProgress([]);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        toast.error('Failed to load enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user, navigate]);

  const getCourseProgress = (courseId: string) => {
    const progress = courseProgress.find(p => p.course_id === courseId);
    return progress ? progress.progress_percentage : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Learning Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Continue your learning journey and track your progress across all enrolled courses.
            </p>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledCourses.map(course => (
                <Card key={course.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold">{course.title}</CardTitle>
                    <CardDescription className="text-gray-500">{course.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-32 object-cover rounded-md mb-4"
                      />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {course.duration_minutes} minutes
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">{course.category}</Badge>
                    </div>
                    <Progress value={getCourseProgress(course.id)} className="mb-4" />
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Progress: {getCourseProgress(course.id)}%</span>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        120 students
                      </div>
                    </div>
                    <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                      <Link to={`/learning/course/${course.id}`} className="flex items-center justify-center">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No courses enrolled yet</h2>
              <p className="text-gray-600 mb-6">Explore our wide range of courses and start your learning journey today.</p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LearningPage;
