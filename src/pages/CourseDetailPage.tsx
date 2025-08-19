import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, Users, Tag, FileText, Link2, PlayCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import WishlistButton from '@/components/WishlistButton';
import GiftCourseButton from '@/components/course/GiftCourseButton';

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  price: number;
  lessons_count: number;
  duration: number;
  category: string;
  level: string;
  language: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  promo_video_url: string;
  promo_code: string;
  status: string;
  instructor_name: string;
  instructor_avatar: string;
}

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        throw new Error('Failed to fetch course');
      }

      // Extract instructor name and avatar from the profiles object
      const instructorName = data?.profiles?.full_name || 'Unknown Instructor';
      const instructorAvatar = data?.profiles?.avatar_url || '';

      return {
        ...data,
        instructor_name: instructorName,
        instructor_avatar: instructorAvatar,
      } as Course;
    },
  });

  const { data: lessons, isLoading: isLessonsLoading, isError: isLessonsError } = useQuery({
    queryKey: ['lessons', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching lessons:', error);
        throw new Error('Failed to fetch lessons');
      }

      return data;
    },
  });

  useEffect(() => {
    const checkEnrollment = async () => {
      if (user && id) {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id);

        if (error) {
          console.error('Error checking enrollment:', error);
          toast.error('Failed to check enrollment status');
        } else {
          setIsEnrolled(data && data.length > 0);
        }
      }
    };

    checkEnrollment();
  }, [user, id]);

  if (isLoading) return <Layout><div>Loading course details...</div></Layout>;
  if (isError || !course) return <Layout><div>Failed to load course details.</div></Layout>;

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([
          {
            user_id: user.id,
            course_id: course.id,
            enrollment_date: new Date().toISOString(),
            payment_status: 'completed',
          },
        ]);

      if (error) {
        console.error('Error enrolling in course:', error);
        toast.error('Failed to enroll in course');
      } else {
        setIsEnrolled(true);
        toast.success('Successfully enrolled in course!');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex space-x-2">
              <li className="flex items-center">
                <a href="/" className="text-gray-600 hover:text-gray-800">Home</a>
                <span className="mx-2 text-gray-400">/</span>
              </li>
              <li className="flex items-center">
                <a href="/courses" className="text-gray-600 hover:text-gray-800">Courses</a>
                <span className="mx-2 text-gray-400">/</span>
              </li>
              <li className="text-gray-500">
                {course.title}
              </li>
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <div className="relative py-12 md:py-24 bg-white text-gray-800">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 opacity-30"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="md:flex md:items-center">
              <div className="md:w-2/3 md:pr-8">
                <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                <p className="text-lg mb-6">{course.subtitle}</p>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>Updated {format(new Date(course.updated_at), 'PPP')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{course.duration} hours</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{course.lessons_count} Lessons</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge>{course.category}</Badge>
                  <Badge variant="secondary">{course.level}</Badge>
                </div>
              </div>
              <div className="md:w-1/3">
                <img src={course.image_url} alt={course.title} className="rounded-lg shadow-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Course Description */}
              <Card className="mb-6">
                <CardContent className="prose max-w-none">
                  <h2 className="text-2xl font-semibold mb-4">About this course</h2>
                  <p>{course.description}</p>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Card className="mb-6">
                <CardContent>
                  <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
                  {isLessonsLoading ? (
                    <div>Loading lessons...</div>
                  ) : isLessonsError ? (
                    <div>Failed to load lessons.</div>
                  ) : (
                    <Accordion type="single" collapsible>
                      {lessons?.map((lesson) => (
                        <AccordionItem key={lesson.id} value={lesson.id}>
                          <AccordionTrigger className="text-lg font-medium">{lesson.title}</AccordionTrigger>
                          <AccordionContent className="py-2">
                            <p className="text-gray-600">{lesson.description}</p>
                            <Button variant="link" onClick={() => navigate(`/lesson/${lesson.id}`)}>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Start Lesson
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Instructor Details */}
              <Card className="mb-6">
                <CardContent>
                  <h2 className="text-2xl font-semibold mb-4">Instructor</h2>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={course.instructor_avatar} alt={course.instructor_name} />
                      <AvatarFallback>{course.instructor_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium">{course.instructor_name}</h3>
                      <p className="text-gray-600">Expert in {course.category}</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <p className="text-gray-600">
                    {/* Instructor bio or additional information can be added here */}
                    Learn from one of the best instructors in the field.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Preview */}
              <Card>
                <CardContent>
                  <h2 className="text-xl font-semibold mb-4">Course Preview</h2>
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <iframe
                      src={course.promo_video_url}
                      title="Course Preview"
                      allowFullScreen
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-gray-600">Watch this short preview to get an idea of what you'll learn in this course.</p>
                </CardContent>
              </Card>

              {/* Pricing and Enrollment */}
              <Card>
                <CardContent>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">Price:</h2>
                    <div className="text-2xl font-bold">${course.price?.toFixed(2)}</div>
                    <p className="text-green-600">30-Day Money-Back Guarantee</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {isEnrolled ? (
                      <Button className="w-full" onClick={() => navigate(`/learning/course/${id}`)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Go to Course
                      </Button>
                    ) : (
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" onClick={handleEnroll}>
                        Enroll Now
                      </Button>
                    )}

                    <Button variant="outline" className="w-full">
                      <Tag className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>

                    {/* Wishlist Button */}
                    <WishlistButton
                      itemId={course.id}
                      itemType="course"
                      className="w-full"
                    />

                    {/* Gift Course Button */}
                    <GiftCourseButton course={{
                      id: course.id,
                      title: course.title,
                      price: course.price || 0
                    }} />
                  </div>
                </CardContent>
              </Card>

              {/* Course Details */}
              <Card>
                <CardContent>
                  <h2 className="text-xl font-semibold mb-4">Course Details</h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="font-medium">Category:</span>
                      <span className="ml-auto">{course.category}</span>
                    </div>
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="font-medium">Level:</span>
                      <span className="ml-auto">{course.level}</span>
                    </div>
                    <div className="flex items-center">
                      <Link2 className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="font-medium">Language:</span>
                      <span className="ml-auto">{course.language}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
