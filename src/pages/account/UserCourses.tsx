
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Play, Clock, Award, AlertCircle } from 'lucide-react';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import { Course } from '@/services/courseService';

const UserCourses = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [favoriteCourses, setFavoriteCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');

  useEffect(() => {
    if (user) {
      fetchUserCourses();
    }
  }, [user]);

  const fetchUserCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses with progress
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          completion_date,
          is_completed,
          payment_status,
          courses:course_id (
            id,
            title,
            description,
            thumbnail_url,
            category,
            difficulty_level,
            duration_minutes,
            is_free,
            price
          )
        `)
        .eq('user_id', user?.id);
        
      if (enrollmentsError) throw enrollmentsError;

      // Fetch favorite courses
      const { data: favorites, error: favoritesError } = await supabase
        .from('course_favorites')
        .select(`
          id,
          added_at,
          courses:course_id (
            id,
            title,
            description,
            thumbnail_url,
            category,
            difficulty_level,
            duration_minutes,
            is_free,
            price
          )
        `)
        .eq('user_id', user?.id);
        
      if (favoritesError) throw favoritesError;
      
      // Process and categorize courses
      const enrolled = enrollments.map(enrollment => ({
        ...enrollment.courses,
        enrollment_id: enrollment.id,
        enrollment_date: enrollment.enrollment_date,
        completion_date: enrollment.completion_date,
        is_completed: enrollment.is_completed,
        payment_status: enrollment.payment_status
      })).filter(Boolean);
      
      const completed = enrolled.filter(course => course.is_completed);
      const inProgress = enrolled.filter(course => !course.is_completed);
      
      const favorited = favorites.map(favorite => ({
        ...favorite.courses,
        favorite_id: favorite.id,
        added_at: favorite.added_at
      })).filter(Boolean);
      
      setEnrolledCourses(inProgress);
      setCompletedCourses(completed);
      setFavoriteCourses(favorited);
    } catch (error) {
      console.error('Error fetching user courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCourseList = (courses: any[]) => {
    if (courses.length === 0) {
      return (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-xl font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === 'enrolled' ? "You haven't enrolled in any courses yet" : 
             activeTab === 'favorites' ? "You haven't added any courses to your favorites yet" : 
             "You haven't completed any courses yet"}
          </p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col overflow-hidden">
            <div className="relative h-48">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-background/80">
                  {course.is_free ? 'Free' : `$${course.price}`}
                </Badge>
              </div>
              {course.payment_status === 'pending' && (
                <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-white px-3 py-1 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Payment pending</span>
                </div>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {course.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-2 flex-grow">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{course.difficulty_level}</Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{Math.round(course.duration_minutes / 60)} hours</span>
                
                {course.is_completed && (
                  <Badge variant="success" className="ml-auto">
                    <Award className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/course/${course.id}/learn`}>
                  <Play className="h-4 w-4 mr-2" />
                  {course.is_completed ? 'Review Course' : 'Continue Learning'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <UserAccountLayout activeTab="courses">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-muted-foreground">Manage your course enrollments and track your progress</p>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="enrolled">
              In Progress ({enrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Favorites ({favoriteCourses.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="enrolled" className="pt-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : renderCourseList(enrolledCourses)}
          </TabsContent>
          
          <TabsContent value="completed" className="pt-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : renderCourseList(completedCourses)}
          </TabsContent>
          
          <TabsContent value="favorites" className="pt-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : renderCourseList(favoriteCourses)}
          </TabsContent>
        </Tabs>
      </UserAccountLayout>
    </Layout>
  );
};

export default UserCourses;
