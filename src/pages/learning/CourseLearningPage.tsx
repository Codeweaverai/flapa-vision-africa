
import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BookOpen, 
  Star, 
  Users,
  Target,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url?: string;
  category: string;
  price: number;
  is_free: boolean;
  creator_id: string;
  duration_minutes: number;
  difficulty_level: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  payment_status: string;
}

const CourseLearningPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    } else {
      setError('No course ID provided');
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (user && courseId && course) {
      fetchEnrollmentData();
    }
  }, [user, courseId, course]);

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      console.log('Fetching course data for ID:', courseId);
      setLoading(true);
      setError(null);
      
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        if (courseError.code === 'PGRST116') {
          setError('Course not found');
        } else {
          setError('Failed to load course data');
        }
        return;
      }

      console.log('Course data fetched:', courseData);
      setCourse(courseData as Course);
    } catch (error) {
      console.error('Error in fetchCourseData:', error);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async () => {
    if (!user || !courseId) return;

    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        console.error('Error fetching enrollment:', enrollmentError);
        return;
      }

      setEnrollment(enrollmentData as CourseEnrollment);
    } catch (error) {
      console.error('Error in fetchEnrollmentData:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Course not found'}
          </h1>
          <Link to="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrolledUser = enrollment && enrollment.payment_status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{course.category}</Badge>
            <Badge variant="outline">{course.difficulty_level}</Badge>
            {course.is_free && <Badge className="bg-green-500">Free</Badge>}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{course.summary}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{course.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>Course Material</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Course Content */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">{course.description}</p>
                
                {enrolledUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-600">You are enrolled in this course</span>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      onClick={() => toast.success('Course content will be available soon!')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Learning
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-4">Ready to start learning?</h3>
                    <Link to={`/course/${courseId}`}>
                      <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                        View Course Details
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Info Sidebar */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-semibold">Duration:</span>
                  <span className="ml-2">{course.duration_minutes} minutes</span>
                </div>
                <div>
                  <span className="font-semibold">Level:</span>
                  <span className="ml-2">{course.difficulty_level}</span>
                </div>
                <div>
                  <span className="font-semibold">Category:</span>
                  <span className="ml-2">{course.category}</span>
                </div>
                <div>
                  <span className="font-semibold">Price:</span>
                  <span className="ml-2">
                    {course.is_free ? 'Free' : `$${course.price}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;
