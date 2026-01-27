import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { 
  Award, 
  Download, 
  Calendar, 
  CheckCircle, 
  Star,
  TrendingUp,
  GraduationCap,
  Target,
  BookOpen,
  Users,
  Clock,
  Heart,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateDisplay from '@/components/certificate/CertificateDisplay';

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Your Results
              </h3>
              <p className="text-muted-foreground text-lg">
                Gathering your achievements and certificates...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  enrollment_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  course_id?: string;  // Added for course identification
  course_title?: string;  // Added for course identification
  quiz: {
    title: string;
    lesson_id?: string;
    module_id?: string;
  };
}

interface ExamResult {
  id: string;
  enrollment_id: string; // Added to connect to quiz attempts
  score: number;
  percentage_score: number;
  passed: boolean;
  quiz_scores: number[];
  final_grade: number;
  completed_at: string;
  course: {
    title: string;
    thumbnail_url?: string;
    creator_id?: string;
  };
  exam: {
    title: string;
    passing_score: number;
  };
}

interface Certificate {
  id: string;
  verification_code: string;
  issue_date: string;
  pdf_url?: string;
  course_title?: string;
  creator_id?: string;
  course_id?: string;
}

interface CourseSkill {
  id: string;
  skill_name: string;
  skill_description?: string;
  skill_level: string;
  order_index: number;
  is_core_skill: boolean;
}


const CourseResultsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [courseSkills, setCourseSkills] = useState<Record<string, CourseSkill[]>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2; // Show only 2 courses per page

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadResults();
  }, [user]);

  const loadResults = async () => {
    try {
      // Fetch exam results with proper error handling
      const { data: resultsData, error: resultsError } = await supabase
        .from('final_exam_results')
        .select(`
          *,
          course:courses!final_exam_results_course_id_fkey(title, thumbnail_url, creator_id),
          exam:final_exams!final_exam_results_exam_id_fkey(title, passing_score)
        `)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false });

      if (resultsError) {
        console.error('Error fetching exam results:', resultsError);
      } else {
        // Transform the data to match our interface
        const allTransformedResults: ExamResult[] = resultsData?.map(result => {
          // Safely convert quiz_scores from Json to number[]
          let quizScores: number[] = [];
          if (Array.isArray(result.quiz_scores)) {
            quizScores = result.quiz_scores.map((score: any) => {
              const numScore = Number(score);
              return isNaN(numScore) ? 0 : numScore;
            });
          }

          return {
            id: result.id,
            enrollment_id: result.enrollment_id, // Include the enrollment_id to connect to quiz attempts
            score: result.score,
            percentage_score: result.percentage_score,
            passed: result.passed,
            quiz_scores: quizScores,
            final_grade: result.final_grade,
            completed_at: result.completed_at,
            course: {
              title: result.course?.title || 'Unknown Course',
              thumbnail_url: result.course?.thumbnail_url,
              creator_id: result.course?.creator_id
            },
            exam: {
              title: result.exam?.title || 'Final Exam',
              passing_score: result.exam?.passing_score || 70
            }
          };
        }) || [];

        // Filter to keep only the highest result per course
        const courseMap = new Map<string, ExamResult>();

        allTransformedResults.forEach(result => {
          const existingResult = courseMap.get(result.course.title);

          if (!existingResult || result.final_grade > existingResult.final_grade) {
            courseMap.set(result.course.title, result);
          }
        });

        // Convert map back to array
        setExamResults(Array.from(courseMap.values()));
      }

      // Fetch quiz attempts with course information in a more efficient way
      // Get lesson-based quiz attempts with course info
      const { data: lessonQuizAttempts, error: lessonQuizError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes!inner (
            title,
            lesson_id,
            lessons!inner (
              course_modules!inner (
                courses!inner (id, title)
              )
            )
          )
        `)
        .eq('user_id', user!.id)
        .not('quiz.lesson_id', 'is', null);

      // Get module-based quiz attempts with course info
      const { data: moduleQuizAttempts, error: moduleQuizError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes!inner (
            title,
            module_id,
            course_modules!inner (
              courses!inner (id, title)
            )
          )
        `)
        .eq('user_id', user!.id)
        .not('quiz.module_id', 'is', null);

      if (lessonQuizError) {
        console.error('Error fetching lesson quiz attempts:', lessonQuizError);
      }
      if (moduleQuizError) {
        console.error('Error fetching module quiz attempts:', moduleQuizError);
      }

      // Combine and transform the quiz attempts
      const allQuizAttempts = [
        ...(lessonQuizAttempts || []).map(attempt => ({
          ...attempt,
          course_id: attempt.quiz?.lessons?.course_modules?.courses?.id,
          course_title: attempt.quiz?.lessons?.course_modules?.courses?.title
        })),
        ...(moduleQuizAttempts || []).map(attempt => ({
          ...attempt,
          course_id: attempt.quiz?.course_modules?.courses?.id,
          course_title: attempt.quiz?.course_modules?.courses?.title
        }))
      ];

      const transformedQuizAttempts: QuizAttempt[] = allQuizAttempts.map(attempt => ({
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        user_id: attempt.user_id,
        enrollment_id: attempt.enrollment_id,
        score: attempt.score,
        passed: attempt.passed,
        attempt_number: attempt.attempt_number,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        created_at: attempt.created_at,
        updated_at: attempt.updated_at,
        course_id: attempt.course_id,
        course_title: attempt.course_title,
        quiz: {
          title: attempt.quiz?.title || 'Untitled Quiz',
          lesson_id: attempt.quiz?.lesson_id,
          module_id: attempt.quiz?.module_id
        }
      }));

      setQuizAttempts(transformedQuizAttempts);

      // Fetch certificates with better error handling
      const { data: certEnrollments, error: certEnrollmentError } = await supabase
        .from('course_enrollments')
        .select('id, course_id, courses!course_enrollments_course_id_fkey(title, creator_id)')
        .eq('user_id', user!.id);

      if (certEnrollmentError) {
        console.error('Error fetching enrollments for certificates:', certEnrollmentError);
      } else if (certEnrollments && certEnrollments.length > 0) {
        const enrollmentIds = certEnrollments.map(e => e.id);

        const { data: certificatesData, error: certificatesError } = await supabase
          .from('certificates')
          .select('*')
          .in('enrollment_id', enrollmentIds)
          .order('issue_date', { ascending: false });

        if (certificatesError) {
          console.error('Error fetching certificates:', certificatesError);
        } else {
          // Transform certificates with course titles
          const transformedCertificates: Certificate[] = certificatesData?.map(cert => {
            const enrollment = certEnrollments.find(e => e.id === cert.enrollment_id);
            return {
              id: cert.id,
              verification_code: cert.verification_code,
              issue_date: cert.issue_date,
              pdf_url: cert.pdf_url || undefined,
              course_title: enrollment?.courses?.title || 'Course Certificate',
              creator_id: enrollment?.courses?.creator_id,
              course_id: enrollment?.course_id
            };
          }) || [];

          setCertificates(transformedCertificates);

          // Fetch skills for each course with certificates
          const courseIds = transformedCertificates
            .map(cert => cert.course_id)
            .filter(Boolean) as string[];

          if (courseIds.length > 0) {
            const { data: skillsData, error: skillsError } = await supabase
              .from('course_skill_outcomes')
              .select('*')
              .in('course_id', courseIds)
              .order('order_index', { ascending: true });

            if (!skillsError && skillsData) {
              const skillsByCourse: Record<string, CourseSkill[]> = {};
              skillsData.forEach(skill => {
                if (!skillsByCourse[skill.course_id]) {
                  skillsByCourse[skill.course_id] = [];
                }
                skillsByCourse[skill.course_id].push(skill);
              });
              setCourseSkills(skillsByCourse);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500 text-white';
      case 'intermediate':
        return 'bg-blue-500 text-white';
      case 'advanced':
        return 'bg-purple-500 text-white';
      case 'expert':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Calculate quiz performance per course by aggregating from quiz_attempts
  const getQuizPerformanceByCourse = (courseTitle: string) => {
    // Find all quiz attempts that are related to this specific course
    // We can now use the course_title that's included in each quiz attempt
    const courseQuizzes = quizAttempts.filter(qa =>
      qa.course_title === courseTitle
    );

    if (courseQuizzes.length === 0) {
      return { averageScore: 0, totalQuizzes: 0, passedQuizzes: 0 };
    }

    const totalScore = courseQuizzes.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = Math.round(totalScore / courseQuizzes.length);
    const passedQuizzes = courseQuizzes.filter(qa => qa.passed).length;

    return {
      averageScore,
      totalQuizzes: courseQuizzes.length,
      passedQuizzes
    };
  };

  // Calculate combined course grade (average of quizzes and final exam)
  const getCombinedCourseGrade = (courseTitle: string) => {
    const examResult = examResults.find(er => er.course.title === courseTitle);
    if (!examResult) return 0;

    const quizPerformance = getQuizPerformanceByCourse(courseTitle);

    // Calculate combined grade as average of quiz average and final exam score
    if (quizPerformance.totalQuizzes > 0) {
      return Math.round((quizPerformance.averageScore + examResult.percentage_score) / 2);
    } else {
      return examResult.percentage_score;
    }
  };


  // Function to share certificate as a post to LinkedIn
  const shareToLinkedInPost = (certificate: Certificate) => {
    // Get skills for this course to include in the post
    const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
    const skillNames = skills.slice(0, 5).map(skill => skill.skill_name).join(', '); // Limit to first 5 skills

    // Create share URL for LinkedIn with a congratulatory message
    // Use the proper LinkedIn share URL that supports pre-populated content
    const certificateUrl = `https://skillpulse.cloud/verify?code=${certificate.verification_code}`;
    const shareText = `🎓 Just completed ${certificate.course_title} with SkillPulse Innovations Limited! 🌟 Achieved professional development in ${skillNames || 'various skills'} and earned my certification. So proud of this milestone! 🚀 #LearningJourney #Achievement #Certification #ProfessionalDevelopment #SkillPulse`;

    // LinkedIn doesn't allow pre-populating text in shares anymore for privacy reasons
    // We'll use the official share URL that opens the share composer with the URL pre-filled
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;

    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  // Function to add certificate to LinkedIn profile
  const addToLinkedInProfile = (certificate: Certificate) => {
    // Get skills for this course to include in the profile
    const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
    const skillNames = skills.slice(0, 5).map(skill => skill.skill_name).join(', '); // Limit to first 5 skills

    // Extract year from issue date
    const issueDate = new Date(certificate.issue_date);
    const year = issueDate.getFullYear();
    const month = issueDate.getMonth() + 1; // Month is 0-indexed

    // Create the LinkedIn add to profile URL with course details and skills
    const profileUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.course_title)}&organizationId=1337&organizationName=${encodeURIComponent('SkillPulse Innovations Limited')}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(`https://skillpulse.cloud/verify?code=${certificate.verification_code}`)}&certId=${certificate.verification_code}`;

    window.open(profileUrl, '_blank', 'width=800,height=600');
  };

  const viewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  // Calculate statistics
  const totalCourses = examResults.length;
  const passedCourses = examResults.filter(r => r.passed).length;
  const averageGrade = examResults.length > 0
    ? Math.round(examResults.reduce((sum, r) => sum + getCombinedCourseGrade(r.course.title), 0) / examResults.length)
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-4">
                Your Learning Achievements
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Track your progress, celebrate your successes, and showcase your certificates
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-orange-500 mr-4" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
                      <p className="text-sm text-gray-600">Courses Taken</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{passedCourses}</p>
                      <p className="text-sm text-gray-600">Courses Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-500 mr-4" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{averageGrade}%</p>
                      <p className="text-sm text-gray-600">Average Grade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exam Results Section */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Target className="h-6 w-6" />
                      Exam Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {examResults.length > 0 ? (
                      examResults.map((result) => (
                        <div
                          key={result.id}
                          className={`p-6 rounded-xl border-l-4 transition-all duration-300 hover:shadow-lg ${
                            result.passed
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                              {result.course.title}
                            </h3>
                            <Badge
                              className={`px-3 py-1 text-sm font-semibold ${
                                result.passed
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              {result.passed ? 'PASSED' : 'FAILED'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6 mb-4">
                            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                              <div className="text-2xl font-bold text-purple-600">
                                {getCombinedCourseGrade(result.course.title)}%
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Combined Score</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                              <div className="text-2xl font-bold text-orange-600">
                                {result.final_grade}%
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Final Grade</div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Final Exam Score</span>
                              <span className="font-medium">
                                {result.percentage_score}%
                              </span>
                            </div>
                            <Progress
                              value={result.percentage_score}
                              className={`h-2 ${
                                result.passed ? 'bg-green-200' : 'bg-red-200'
                              }`}
                            />
                          </div>

                          {/* Overall Quiz Average Section */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Overall Quiz Average</span>
                              <span className="font-medium">
                                {getQuizPerformanceByCourse(result.course.title).averageScore}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {getQuizPerformanceByCourse(result.course.title).totalQuizzes} quizzes • {getQuizPerformanceByCourse(result.course.title).passedQuizzes} passed
                            </div>
                            <Progress
                              value={getQuizPerformanceByCourse(result.course.title).averageScore}
                              className="h-2 bg-blue-200"
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(result.completed_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Pass: {result.exam.passing_score}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exam Results Yet</h3>
                        <p className="text-gray-600">Complete course exams to see your results here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Certificates Section */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-orange-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <GraduationCap className="h-6 w-6" />
                      Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {certificates.length > 0 ? (
                      certificates.map((certificate) => {
                        // FIXED: Add null check for courseSkills[certificate.course_id]
                        const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
                        const coreSkills = skills.filter(skill => skill.is_core_skill);
                        const displayedSkills = coreSkills.length > 0 ? coreSkills : skills.slice(0, 4);
                        
                        return (
                          <div
                            key={certificate.id}
                            className="p-6 rounded-xl bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-3">
                                  <Award className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                    {certificate.course_title}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Verification Code: <span className="font-mono text-orange-600">{certificate.verification_code}</span>
                                  </p>
                                  {displayedSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {displayedSkills.map((skill) => (
                                        <Badge 
                                          key={skill.id}
                                          variant="outline"
                                          className={`text-xs ${getSkillLevelColor(skill.skill_level)} border-transparent`}
                                        >
                                          <Zap className="h-3 w-3 mr-1" />
                                          {skill.skill_name}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                Issued on {new Date(certificate.issue_date).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => shareToLinkedInPost(certificate)}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                  Share Post
                                </Button>
                                <Button
                                  onClick={() => addToLinkedInProfile(certificate)}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                  Add to Profile
                                </Button>
                                <Button
                                  onClick={() => viewCertificate(certificate)}
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <GraduationCap className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
                        <p className="text-gray-600 mb-4">Complete courses to earn certificates.</p>
                        <Button 
                          onClick={() => navigate('/explore-courses')}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                          Browse Courses
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Achievement Stats */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                      Achievement Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600">
                          {passedCourses}
                        </div>
                        <div className="text-sm text-gray-600">Certificates Earned</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl border border-orange-100">
                        <div className="text-2xl font-bold text-orange-600">
                          {averageGrade}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Certificate - {selectedCertificate?.course_title}</DialogTitle>
            <DialogDescription>
              View and download your course completion certificate
            </DialogDescription>
          </DialogHeader>
          {selectedCertificate && (
            <CertificateDisplay
              certificate={selectedCertificate}
              courseSkills={courseSkills}
              showActions={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CourseResultsPage;
