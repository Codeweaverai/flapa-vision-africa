
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CalendarDays, BookOpen, Award } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CourseEnrollButton from '@/components/payment/CourseEnrollButton';
import { formatDuration } from '@/lib/utils';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        
        // Get course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            profiles:creator_id (username, full_name, avatar_url)
          `)
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);
        
        // Check if user is enrolled
        if (user) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('id, payment_status')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .maybeSingle();
            
          if (!enrollmentError && enrollmentData) {
            setIsEnrolled(true);
          }
        }
        
        // Get course modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            id, 
            title, 
            description,
            order_index,
            lessons:lessons (
              id,
              title,
              content_type,
              order_index
            )
          `)
          .eq('course_id', id)
          .order('order_index', { ascending: true });
          
        if (!modulesError) {
          // Sort lessons within each module
          const sortedModules = modulesData.map(module => ({
            ...module,
            lessons: module.lessons ? 
              module.lessons.sort((a: any, b: any) => a.order_index - b.order_index) : 
              []
          }));
          setModules(sortedModules);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
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
        <div className="container py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-12">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <p className="mt-4">The course you're looking for doesn't exist or has been removed.</p>
          <Button as={Link} to="/courses" className="mt-6">
            Browse all courses
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - course info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.summary}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{course.category}</Badge>
              <Badge variant="outline">{course.difficulty_level}</Badge>
              {course.is_free ? (
                <Badge variant="secondary">Free</Badge>
              ) : (
                <Badge variant="secondary">${course.price}</Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.duration_minutes)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Updated {new Date(course.updated_at).toLocaleDateString()}</span>
              </div>
              
              {course.certificate_enabled && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Certificate of completion</span>
                </div>
              )}
            </div>
            
            <Tabs defaultValue="overview" className="mt-8">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">About this course</h2>
                  <p className="whitespace-pre-line">{course.description}</p>
                </div>
                
                {course?.profiles && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Instructor</h2>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        {course.profiles.avatar_url ? (
                          <img 
                            src={course.profiles.avatar_url} 
                            alt={course.profiles.username || 'Instructor'} 
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{course.profiles.full_name || course.profiles.username}</p>
                        <p className="text-sm text-muted-foreground">Instructor</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="curriculum" className="mt-4">
                <h2 className="text-xl font-semibold mb-3">Course Content</h2>
                
                {modules.length === 0 ? (
                  <p className="text-muted-foreground">No content available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <Card key={module.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">
                              Module {index + 1}: {module.title}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                            </span>
                          </div>
                          
                          {module.description && (
                            <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                          )}
                          
                          {isEnrolled && (
                            <div className="mt-3 space-y-2">
                              {module.lessons.map((lesson: any) => (
                                <div key={lesson.id} className="flex items-center gap-2 text-sm">
                                  {lesson.content_type === 'video' ? (
                                    <span className="h-3 w-3 bg-primary rounded-full"></span>
                                  ) : (
                                    <span className="h-3 w-3 border border-primary rounded-full"></span>
                                  )}
                                  <span>{lesson.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - enrollment card */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                {course.thumbnail_url && (
                  <div className="aspect-video overflow-hidden rounded-md mb-4">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="text-center">
                  {course.is_free ? (
                    <h3 className="text-2xl font-bold">Free</h3>
                  ) : (
                    <h3 className="text-2xl font-bold">${course.price}</h3>
                  )}
                </div>
                
                <CourseEnrollButton 
                  courseId={course.id} 
                  title={course.title}
                  isFree={course.is_free} 
                  price={course.price}
                  isEnrolled={isEnrolled}
                  className="w-full"
                />
                
                <Separator className="my-4" />
                
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">This course includes:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{modules.length} {modules.length === 1 ? 'module' : 'modules'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDuration(course.duration_minutes)} of content</span>
                    </li>
                    {course.certificate_enabled && (
                      <li className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span>Certificate of completion</span>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
