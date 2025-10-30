import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Users, 
  BookOpen, 
  Star, 
  Play, 
  CheckCircle,
  Award,
  ArrowLeft,
  Eye,
  Zap,
  Target
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import ReactPlayer from 'react-player';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  is_published: boolean;
  certificate_enabled: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  course_preview?: {
    id: string;
    preview_video_url?: string;
    preview_video_path?: string;
  };
  course_modules: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      description?: string;
      order_index: number;
      content_type: string;
      video_url?: string;
    }>;
  }>;
  course_learning_outcomes: Array<{
    id: string;
    outcome: string;
    order_index: number;
  }>;
  course_skill_outcomes: Array<{
    id: string;
    skill_name: string;
    skill_description?: string;
    skill_level: string;
    order_index: number;
    is_core_skill: boolean;
  }>;
}

const CoursePreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCourse();
    }
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      
      // Fetch course without published check - this is key difference
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError || !courseData) {
        console.error('Error fetching course:', courseError);
        toast.error('Course not found');
        navigate('/creator/courses');
        return;
      }

      // Check if current user is the creator
      if (courseData.creator_id !== user.id) {
        toast.error('You can only preview your own courses');
        navigate('/creator/courses');
        return;
      }

      setIsCreator(true);

      // Fetch related data in parallel
      const [
        creatorResult,
        previewResult,
        modulesResult,
        outcomesResult,
        skillsResult
      ] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .eq('id', courseData.creator_id)
          .single(),

        supabase
          .from('course_previews')
          .select('id, preview_video_url, preview_video_path')
          .eq('course_id', id)
          .maybeSingle(),

        supabase
          .from('course_modules')
          .select(`
            id,
            title,
            description,
            order_index,
            lessons (
              id,
              title,
              description,
              order_index,
              content_type,
              video_url
            )
          `)
          .eq('course_id', id)
          .order('order_index', { ascending: true }),

        supabase
          .from('course_learning_outcomes')
          .select('id, outcome, order_index')
          .eq('course_id', id)
          .order('order_index', { ascending: true }),

        supabase
          .from('course_skill_outcomes')
          .select('id, skill_name, skill_description, skill_level, order_index, is_core_skill')
          .eq('course_id', id)
          .order('order_index', { ascending: true })
      ]);

      // Process data
      const creatorData = creatorResult.status === 'fulfilled' && !creatorResult.value.error ? 
        creatorResult.value.data : { 
          id: courseData.creator_id, 
          full_name: 'Unknown Creator',
          avatar_url: null,
          bio: null
        };

      const previewData = previewResult.status === 'fulfilled' && !previewResult.value.error ? 
        previewResult.value.data : undefined;

      const modulesData = modulesResult.status === 'fulfilled' && !modulesResult.value.error ? 
        modulesResult.value.data : [];

      const outcomesData = outcomesResult.status === 'fulfilled' && !outcomesResult.value.error ? 
        outcomesResult.value.data : [];

      const skillsData = skillsResult.status === 'fulfilled' && !skillsResult.value.error ? 
        previewResult.value.data : [];

      const completeCourse: Course = {
        ...courseData,
        profiles: creatorData,
        course_preview: previewData,
        course_modules: modulesData,
        course_learning_outcomes: outcomesData,
        course_skill_outcomes: skillsData
      };

      setCourse(completeCourse);

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading the course');
    } finally {
      setLoading(false);
    }
  };

  const GradientIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg text-white">
      {children}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
            <Button 
              onClick={() => navigate('/creator/courses')} 
              className="mt-4"
            >
              Back to Courses
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalLessons = course.course_modules.reduce((total, module) => total + module.lessons.length, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Preview Banner */}
        <div className="bg-yellow-500 text-yellow-900 py-2 text-center">
          <div className="container mx-auto px-4 flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">Course Preview Mode - This is how students will see your course</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/creator/courses')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Button>
            
            <div className="flex gap-3">
              <Badge variant={course.is_published ? "default" : "secondary"} className={course.is_published ? "bg-green-500" : "bg-yellow-500"}>
                {course.is_published ? "Published" : "Draft"}
              </Badge>
              <Button
                onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                variant="outline"
              >
                Edit Course
              </Button>
              {!course.is_published && (
                <Button
                  onClick={() => navigate(`/creator/courses/${course.id}/publish`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publish Now
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                        {course.category}
                      </Badge>
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        {course.difficulty_level}
                      </Badge>
                      {course.certificate_enabled && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Award className="w-3 h-3 mr-1" />
                          Certificate
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
                    <p className="text-gray-600 text-base mb-6">{course.summary}</p>
                    
                    {/* Course Stats */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Clock className="w-4 h-4" />
                        </GradientIcon>
                        <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <BookOpen className="w-4 h-4" />
                        </GradientIcon>
                        <span>{totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Preview Video */}
                  {course.course_preview?.preview_video_url && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Course Preview</h3>
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <ReactPlayer
                          url={course.course_preview.preview_video_url}
                          controls={true}
                          width="100%"
                          height="100%"
                          light={course.thumbnail_url}
                        />
                      </div>
                    </div>
                  )}

                  {/* Instructor */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                    <Avatar className="w-12 h-12 border-2 border-orange-300">
                      <AvatarImage src={course.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        {course.profiles?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="font-semibold text-gray-900">{course.profiles?.full_name || 'Unknown Creator'}</p>
                      {course.profiles?.bio && (
                        <p className="text-sm text-gray-600 mt-1">{course.profiles.bio}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Tabs */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="curriculum" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Curriculum
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Skills
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">About this course</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed text-base">{course.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {course.course_learning_outcomes.length > 0 && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">What you'll learn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.course_learning_outcomes.map((outcome) => (
                            <div key={outcome.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-purple-50">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{outcome.outcome}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="curriculum">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Course curriculum</h3>
                      <div className="space-y-4">
                        {course.course_modules.map((module, moduleIndex) => (
                          <div key={module.id} className="border border-gray-200 rounded-lg p-4 bg-white/80 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-2">
                              <GradientIcon>
                                <BookOpen className="w-4 h-4" />
                              </GradientIcon>
                              <h4 className="font-semibold text-lg text-gray-900">
                                Module {moduleIndex + 1}: {module.title}
                              </h4>
                            </div>
                            {module.description && (
                              <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                            )}
                            <div className="space-y-2">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div key={lesson.id} className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 rounded-lg transition-all duration-200">
                                  <GradientIcon>
                                    <Play className="w-3 h-3" />
                                  </GradientIcon>
                                  <span className="text-sm text-gray-700">
                                    {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Skills You'll Gain</h3>
                      {course.course_skill_outcomes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {course.course_skill_outcomes.map((skill) => (
                            <div key={skill.id} className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-200 p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <GradientIcon>
                                  <Zap className="w-4 h-4" />
                                </GradientIcon>
                                <div>
                                  <h5 className="font-semibold text-gray-900">{skill.skill_name}</h5>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {skill.skill_level}
                                  </Badge>
                                </div>
                              </div>
                              {skill.skill_description && (
                                <p className="text-gray-700 text-sm">{skill.skill_description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-center py-8">No skills defined for this course yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.is_free ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        <PriceDisplay amount={course.price} originalCurrency="USD" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-gray-400 text-white font-semibold py-3"
                      disabled
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Mode
                    </Button>
                    <div className="text-center text-sm text-gray-600 space-y-2">
                      <p>This is a preview of how students will see your course</p>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p>Certificate: {course.certificate_enabled ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Features */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900">This course includes:</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <Clock className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">{Math.floor(course.duration_minutes / 60)} hours on-demand video</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <BookOpen className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <Users className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">Access on mobile and desktop</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center gap-3">
                        <GradientIcon>
                          <Award className="w-4 h-4" />
                        </GradientIcon>
                        <span className="text-sm text-gray-700">Certificate of completion</span>
                      </div>
                    )}
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

export default CoursePreviewPage;
