
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { Star, BookOpen, Users, Award, Globe, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InstructorProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  website_url?: string;
  social_links: any;
  is_verified: boolean;
}

interface Course {
  id: string;
  title: string;
  summary: string;
  thumbnail_url?: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  enrollment_count?: number;
}

const InstructorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInstructorData();
    }
  }, [id]);

  const loadInstructorData = async () => {
    try {
      setLoading(true);

      // Fetch instructor profile
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (instructorError) throw instructorError;
      setInstructor(instructorData);

      // Fetch instructor's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', instructorData.user_id)
        .eq('is_published', true);

      if (coursesError) throw coursesError;

      // Get enrollment counts for each course
      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map(course => course.id);
        
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .in('course_id', courseIds);

        const enrollmentCounts = enrollments?.reduce((acc, enrollment) => {
          acc[enrollment.course_id] = (acc[enrollment.course_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const coursesWithEnrollments = coursesData.map(course => ({
          ...course,
          enrollment_count: enrollmentCounts[course.id] || 0
        }));

        setCourses(coursesWithEnrollments);
        setTotalStudents(enrollments?.length || 0);

        // Get average rating from all course reviews
        const { data: reviews } = await supabase
          .from('course_reviews')
          .select('rating')
          .in('course_id', courseIds);

        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          setAverageRating(Math.round(avgRating * 10) / 10);
          setTotalReviews(reviews.length);
        }
      }
    } catch (error) {
      console.error('Error loading instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-purple-800">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!instructor) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-purple-800">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-4">Instructor Not Found</h1>
              <p className="mb-4">The instructor profile you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-purple-800 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-white/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-white/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Avatar className="w-32 h-32 mx-auto mb-6 border-4 border-white/20 shadow-2xl">
              <AvatarImage src={instructor.avatar_url} />
              <AvatarFallback className="text-4xl bg-white/10 text-white">
                {instructor.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                {instructor.full_name}
              </h1>
              {instructor.is_verified && (
                <Award className="h-8 w-8 text-yellow-400" />
              )}
            </div>

            <div className="flex items-center justify-center gap-8 mb-6 text-white/90">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-xl font-semibold">{averageRating}</span>
                <span className="text-sm">({totalReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-xl font-semibold">{totalStudents}</span>
                <span className="text-sm">students</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="text-xl font-semibold">{courses.length}</span>
                <span className="text-sm">courses</span>
              </div>
            </div>

            {instructor.website_url && (
              <Button variant="secondary" size="lg" className="mb-8" asChild>
                <a href={instructor.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Website
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>

          {/* Bio Section */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                {instructor.bio || 'No bio available for this instructor.'}
              </p>
            </CardContent>
          </Card>

          {/* Courses Section */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Courses by {instructor.full_name}</CardTitle>
              <CardDescription className="text-white/80">
                Explore all courses created by this instructor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
                      <CardContent className="p-0">
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        )}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="bg-white/20 text-white">
                              {course.category}
                            </Badge>
                            <Badge variant="outline" className="border-white/30 text-white">
                              {course.difficulty_level}
                            </Badge>
                          </div>
                          
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-200 transition-colors">
                            {course.title}
                          </h3>
                          
                          <p className="text-white/80 text-sm mb-4 line-clamp-2">
                            {course.summary}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-white/70">
                            <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                            <span>{course.enrollment_count || 0} students</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-white">
                              {course.is_free ? (
                                <span className="text-lg font-bold text-green-400">Free</span>
                              ) : (
                                <span className="text-lg font-bold">${course.price}</span>
                              )}
                            </div>
                            <Button size="sm" variant="secondary" asChild>
                              <Link to={`/learning/course-detail/${course.id}`}>
                                View Course
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-white/50" />
                  <h3 className="text-xl font-medium mb-2">No courses yet</h3>
                  <p className="text-white/70">This instructor hasn't published any courses yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default InstructorProfilePage;
