
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Award, Play, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrollment_date: string;
  is_completed: boolean;
  courses: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    category: string;
    difficulty_level: string;
    duration_minutes: number;
    creator_id: string;
  };
}

const MyCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchEnrolledCourses();
  }, [user, navigate]);

  const fetchEnrolledCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          enrollment_date,
          is_completed,
          courses:course_id (
            id,
            title,
            description,
            thumbnail_url,
            category,
            difficulty_level,
            duration_minutes,
            creator_id
          )
        `)
        .eq('user_id', user.id)
        .order('enrollment_date', { ascending: false });

      if (error) {
        console.error('Error fetching enrolled courses:', error);
        toast.error('Failed to load your courses');
        return;
      }

      setEnrolledCourses(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const continueCourse = (courseId: string) => {
    navigate(`/learning/course/${courseId}`);
  };

  const completedCourses = enrolledCourses.filter(enrollment => 
    enrollment.is_completed
  );
  
  const inProgressCourses = enrolledCourses.filter(enrollment => 
    !enrollment.is_completed
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-light-purple">
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">My Courses</h1>
            <p className="text-xl text-muted-foreground">
              Track your learning progress and continue your educational journey.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Play className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{inProgressCourses.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{completedCourses.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(enrolledCourses.reduce((sum, course) => 
                        sum + (course.courses.duration_minutes || 0), 0) / 60)}h
                    </p>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Courses ({enrolledCourses.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressCourses.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCourses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <CourseGrid courses={enrolledCourses} onContinue={continueCourse} />
            </TabsContent>

            <TabsContent value="in-progress" className="mt-6">
              <CourseGrid courses={inProgressCourses} onContinue={continueCourse} />
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <CourseGrid courses={completedCourses} onContinue={continueCourse} />
            </TabsContent>
          </Tabs>

          {enrolledCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your learning journey by enrolling in some courses.
              </p>
              <Button asChild size="lg">
                <Link to="/explore/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

interface CourseGridProps {
  courses: EnrolledCourse[];
  onContinue: (courseId: string) => void;
}

const CourseGrid = ({ courses, onContinue }: CourseGridProps) => {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No courses in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((enrollment) => (
        <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
          <div className="relative">
            {enrollment.courses.thumbnail_url ? (
              <img
                src={enrollment.courses.thumbnail_url}
                alt={enrollment.courses.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              {enrollment.is_completed ? (
                <Badge variant="default" className="bg-green-500">
                  <Award className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="default" className="bg-blue-500">
                  <Play className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </div>
          
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline">{enrollment.courses.category}</Badge>
              <Badge variant="outline">{enrollment.courses.difficulty_level}</Badge>
            </div>
            <CardTitle className="line-clamp-2">{enrollment.courses.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {enrollment.courses.description}
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {Math.ceil((enrollment.courses.duration_minutes || 0) / 60)} hours
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {enrollment.enrollment_date ? 
                    new Date(enrollment.enrollment_date).toLocaleDateString() : 
                    'Recently enrolled'
                  }
                </div>
              </div>
              
              <Button 
                onClick={() => onContinue(enrollment.courses.id)} 
                className="w-full"
                variant={enrollment.is_completed ? "outline" : "default"}
              >
                {enrollment.is_completed ? 'Review Course' : 'Continue Learning'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyCoursesPage;
