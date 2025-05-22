
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, BookOpen, Users, Award } from 'lucide-react';
import CourseModuleList from '@/components/creator/CourseModuleList';
import CourseEnrollButton from '@/components/payment/CourseEnrollButton';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  is_free: boolean;
  price: number;
  creator_id?: string;
  creator?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Fetch course details
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            creator:creator_id (
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setCourse(data);

        // Fetch enrollment count
        const { count: enrollCount, error: countError } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', id);

        if (countError) throw countError;
        setEnrollmentCount(enrollCount || 0);

        // Check if the current user is enrolled
        if (user) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', id)
            .eq('user_id', user.id)
            .single();

          if (!enrollmentError) {
            setIsEnrolled(true);
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id, user]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="mb-8">The course you are looking for does not exist or has been removed.</p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline">{course.category}</Badge>
              <Badge variant="outline">{course.difficulty_level}</Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                {Math.ceil(course.duration_minutes / 60)} hours
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1 h-4 w-4" />
                {enrollmentCount} student{enrollmentCount !== 1 ? 's' : ''}
              </div>
            </div>
            
            {course.summary && (
              <p className="text-lg">{course.summary}</p>
            )}
            
            <Tabs defaultValue="about" className="w-full">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-4 mt-4">
                <div className="prose max-w-none dark:prose-invert">
                  <h2 className="text-2xl font-semibold mb-4">About This Course</h2>
                  <p className="whitespace-pre-line">{course.description}</p>
                </div>
                
                {course.creator && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Instructor</h2>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted overflow-hidden">
                        {course.creator.avatar_url ? (
                          <img 
                            src={course.creator.avatar_url} 
                            alt={course.creator.full_name || course.creator.username || 'Instructor'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                            {(course.creator.full_name || course.creator.username || 'I')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {course.creator.full_name || course.creator.username || 'Instructor'}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="curriculum" className="mt-4">
                <h2 className="text-2xl font-semibold mb-4">Course Curriculum</h2>
                {course && <CourseModuleList courseId={course.id} />}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="md:col-span-1">
            <Card className="sticky top-20 overflow-hidden">
              <div className="aspect-video w-full bg-muted overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-center">
                  <div className="text-3xl font-bold">
                    {course.is_free ? (
                      'Free'
                    ) : (
                      `$${course.price}`
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <CourseEnrollButton 
                    courseId={course.id}
                    title={course.title}
                    isFree={course.is_free}
                    price={course.price}
                    isEnrolled={isEnrolled}
                    className="w-full"
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-center justify-center">
                      <Award className="h-4 w-4 mr-2" />
                      Certificate of completion
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
