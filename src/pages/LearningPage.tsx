
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Clock, 
  Play, 
  Award, 
  Users, 
  Star, 
  TrendingUp, 
  Target, 
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BarChart3
} from 'lucide-react';

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

interface CourseStats {
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  actualDurationHours: number;
}

interface WeeklyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}

interface Skill {
  id: string;
  name: string;
  level: number;
  progress: number;
  category: string;
  courseTitle: string;
}

const LearningPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const coursesPerPage = 5;

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

          if (!progressError) {
            setCourseProgress(progressData || []);
          }

          // Generate dynamic weekly goals and skills
          await generateDynamicData(courses || [], progressData || []);

          // Fetch real-time course statistics
          await fetchCourseStats(courseIds);
        } else {
          setEnrolledCourses([]);
          setCourseProgress([]);
          setWeeklyGoals([]);
          setSkills([]);
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

  const generateDynamicData = async (courses: Course[], progressData: CourseProgress[]) => {
    if (!user) return;

    try {
      // Calculate dynamic weekly goals
      const totalHoursStudied = courses.reduce((sum, course) => {
        const progress = progressData.find(p => p.course_id === course.id);
        const completionRate = progress ? progress.progress_percentage / 100 : 0;
        return sum + (course.duration_minutes / 60) * completionRate;
      }, 0);

      // Count completed lessons
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', user.id);

      const completedLessons = lessonProgress?.filter(lp => lp.is_completed).length || 0;

      // Count passed exams/quizzes (simplified)
      const { data: examResults } = await supabase
        .from('final_exam_results')
        .select('passed')
        .eq('user_id', user.id)
        .eq('passed', true);

      const passedExams = examResults?.length || 0;

      const dynamicWeeklyGoals: WeeklyGoal[] = [
        { 
          id: '1', 
          title: 'Hours Studied', 
          target: 20, 
          current: Math.round(totalHoursStudied * 10) / 10, 
          unit: 'hours' 
        },
        { 
          id: '2', 
          title: 'Lessons Completed', 
          target: 25, 
          current: completedLessons, 
          unit: 'lessons' 
        },
        { 
          id: '3', 
          title: 'Exams Passed', 
          target: 5, 
          current: passedExams, 
          unit: 'exams' 
        }
      ];

      setWeeklyGoals(dynamicWeeklyGoals);

      // Generate dynamic skills based on enrolled courses
      const dynamicSkills: Skill[] = courses.map((course, index) => {
        const progress = progressData.find(p => p.course_id === course.id);
        const progressPercentage = progress ? progress.progress_percentage : 0;
        
        return {
          id: course.id,
          name: course.category,
          level: progressPercentage >= 75 ? 3 : progressPercentage >= 50 ? 2 : 1,
          progress: progressPercentage,
          category: course.category,
          courseTitle: course.title
        };
      });

      setSkills(dynamicSkills);
    } catch (error) {
      console.error('Error generating dynamic data:', error);
    }
  };

  const fetchCourseStats = async (courseIds: string[]) => {
    const stats: Record<string, CourseStats> = {};
    
    for (const courseId of courseIds) {
      try {
        // Fetch reviews and ratings
        const { data: reviews } = await supabase
          .from('course_reviews')
          .select('rating')
          .eq('course_id', courseId);

        // Fetch total enrollments (students)
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId);

        // Calculate actual duration from lessons
        const { data: modules } = await supabase
          .from('course_modules')
          .select('id')
          .eq('course_id', courseId);

        let totalDuration = 0;
        if (modules) {
          for (const module of modules) {
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id')
              .eq('module_id', module.id);
            
            if (lessons) {
              totalDuration += lessons.length * 30; // Estimate 30 minutes per lesson
            }
          }
        }

        const averageRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        stats[courseId] = {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews?.length || 0,
          totalStudents: enrollments?.length || 0,
          actualDurationHours: Math.round((totalDuration / 60) * 10) / 10
        };
      } catch (error) {
        console.error(`Error fetching stats for course ${courseId}:`, error);
        stats[courseId] = {
          averageRating: 0,
          totalReviews: 0,
          totalStudents: 0,
          actualDurationHours: 0
        };
      }
    }
    
    setCourseStats(stats);
  };

  const getCourseProgress = (courseId: string) => {
    const progress = courseProgress.find(p => p.course_id === courseId);
    return progress ? progress.progress_percentage : 0;
  };

  const filteredCourses = enrolledCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'in-progress') {
      const progress = getCourseProgress(course.id);
      return matchesSearch && progress > 0 && progress < 100;
    } else if (activeTab === 'completed') {
      const progress = getCourseProgress(course.id);
      return matchesSearch && progress === 100;
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

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
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">My Learning Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Continue your learning journey and track your progress across all enrolled courses.
            </p>
          </div>

          {/* Dynamic Weekly Goals and Skills Tracking Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Weekly Goals */}
            <Card className="bg-gradient-to-r from-orange-100 to-purple-100 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  Weekly Learning Goals
                </CardTitle>
                <p className="text-white/90 text-sm">Track your learning progress this week</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {weeklyGoals.map(goal => (
                  <div key={goal.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">{goal.title}</span>
                      <span className="text-sm font-bold text-orange-600">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={(goal.current / goal.target) * 100} className="h-3 bg-white/50" />
                      <div 
                        className="absolute top-0 left-0 h-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      {Math.round((goal.current / goal.target) * 100)}% Complete
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills Tracking */}
            <Card className="bg-gradient-to-r from-purple-100 to-orange-100 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Skills Development
                </CardTitle>
                <p className="text-white/90 text-sm">Your skill progress from enrolled courses</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {skills.length > 0 ? skills.map(skill => (
                  <div key={skill.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-800">{skill.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Level {skill.level}
                          </Badge>
                          <span className="text-xs text-gray-500">{skill.courseTitle}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-purple-600">{skill.progress}%</span>
                    </div>
                    <div className="relative">
                      <Progress value={skill.progress} className="h-3 bg-white/50" />
                      <div 
                        className="absolute top-0 left-0 h-3 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Enroll in courses to start tracking your skills!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Search and Filter */}
          <Card className="bg-white/90 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                  <TabsList className="grid w-full grid-cols-3 md:w-auto">
                    <TabsTrigger value="all">All Courses</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Course Grid */}
          {paginatedCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
                {paginatedCourses.map(course => {
                  const progress = getCourseProgress(course.id);
                  const stats = courseStats[course.id] || {
                    averageRating: 0,
                    totalReviews: 0,
                    totalStudents: 0,
                    actualDurationHours: 0
                  };
                  
                  return (
                    <Card key={course.id} className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group h-80 flex flex-col">
                      <div className="relative h-32">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-orange-200 to-purple-200 flex items-center justify-center group-hover:from-orange-300 group-hover:to-purple-300 transition-all duration-300">
                            <BookOpen className="h-12 w-12 text-white/80" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                            {progress}%
                          </Badge>
                        </div>
                        {progress === 100 && (
                          <div className="absolute top-2 left-2">
                            <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                            {course.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <CardTitle className="line-clamp-2 text-sm group-hover:text-orange-600 transition-colors">
                            {course.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-xs text-gray-600">
                            {course.summary}
                          </CardDescription>
                          
                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="relative">
                              <Progress value={progress} className="h-1.5 bg-gray-200" />
                              <div 
                                className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-orange-500" />
                              <span className="text-gray-600">
                                {stats.actualDurationHours > 0 
                                  ? `${stats.actualDurationHours}h` 
                                  : `${Math.ceil(course.duration_minutes / 60)}h`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-gray-600">
                                {stats.averageRating > 0 ? `${stats.averageRating}` : 'No reviews'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button asChild className="w-full mt-3 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                          <Link to={`/learning/course/${course.id}`} className="flex items-center justify-center">
                            <Play className="h-3 w-3 mr-1" />
                            Continue Learning
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md mx-auto">
                <BookOpen className="h-16 w-16 mx-auto mb-6 text-gray-400" />
                <h2 className="text-2xl font-bold mb-4">
                  {searchTerm || activeTab !== 'all' ? 'No courses found' : 'No courses enrolled yet'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || activeTab !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'Explore our wide range of courses and start your learning journey today.'}
                </p>
                {!searchTerm && activeTab === 'all' && (
                  <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link to="/explore/courses">Explore Courses</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LearningPage;
