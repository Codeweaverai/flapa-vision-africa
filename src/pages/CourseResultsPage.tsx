
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Award, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  Star,
  Trophy,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CourseResult {
  id: string;
  course_id: string;
  user_id: string;
  final_grade: number;
  percentage_score: number;
  passed: boolean;
  completed_at: string;
  quiz_scores: any[];
}

interface QuizResult {
  id: string;
  quiz_id: string;
  lesson_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  certificate_enabled: boolean;
}

const CourseResultsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [courseResult, setCourseResult] = useState<CourseResult | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseResults();
    }
  }, [courseId, user]);

  const fetchCourseResults = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch final exam results
      const { data: examResults, error: examError } = await supabase
        .from('final_exam_results')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (examError && examError.code !== 'PGRST116') throw examError;
      
      if (examResults && examResults.length > 0) {
        setCourseResult(examResults[0]);
      }

      // Fetch quiz results (mock data for now)
      // In a real implementation, you would fetch from quiz_attempts table
      const mockQuizResults: QuizResult[] = [
        {
          id: '1',
          quiz_id: 'quiz-1',
          lesson_id: 'lesson-1',
          score: 85,
          passed: true,
          completed_at: new Date().toISOString()
        },
        {
          id: '2',
          quiz_id: 'quiz-2',
          lesson_id: 'lesson-2',
          score: 92,
          passed: true,
          completed_at: new Date().toISOString()
        }
      ];
      setQuizResults(mockQuizResults);

    } catch (error) {
      console.error('Error fetching course results:', error);
      toast.error('Failed to load course results');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      // In a real implementation, you would generate and download the certificate
      toast.success('Certificate download will be implemented');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Course Not Found</h2>
              <p className="text-gray-600 mb-6">The course results you're looking for don't exist.</p>
              <Button onClick={() => navigate('/learning')}>
                Back to Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const overallScore = courseResult?.final_grade || 0;
  const hasPassed = courseResult?.passed || false;
  const averageQuizScore = quizResults.length > 0 
    ? quizResults.reduce((acc, quiz) => acc + quiz.score, 0) / quizResults.length 
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/learning/course/${courseId}`)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
              
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Course Results
                </h1>
                <h2 className="text-xl text-gray-600 mb-4">{course.title}</h2>
                
                {/* Overall Result */}
                <div className="flex items-center justify-center mb-6">
                  {hasPassed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-8 w-8 mr-2" />
                      <span className="text-2xl font-bold">Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-8 w-8 mr-2" />
                      <span className="text-2xl font-bold">Not Passed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Overall Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-orange-600" />
                    Overall Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {overallScore}%
                    </div>
                    <p className="text-gray-600">Final Grade</p>
                  </div>
                  
                  <Progress value={overallScore} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {averageQuizScore.toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Avg Quiz Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {quizResults.filter(q => q.passed).length}/{quizResults.length}
                      </div>
                      <p className="text-sm text-gray-600">Quizzes Passed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificate */}
              {course.certificate_enabled && hasPassed && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-600" />
                      Certificate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-6 rounded-lg">
                      <Award className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                      <h3 className="font-semibold text-orange-800 mb-2">
                        Certificate of Completion
                      </h3>
                      <p className="text-sm text-orange-600">
                        Congratulations on completing the course!
                      </p>
                    </div>
                    
                    <Button 
                      onClick={downloadCertificate}
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quiz Results */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
              </CardHeader>
              <CardContent>
                {quizResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No quiz results available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizResults.map((quiz, index) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {quiz.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <h4 className="font-medium">Quiz #{index + 1}</h4>
                            <p className="text-sm text-gray-600">
                              Completed {format(new Date(quiz.completed_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={quiz.passed ? "default" : "destructive"}
                            className={quiz.passed ? "bg-green-100 text-green-800" : ""}
                          >
                            {quiz.score}%
                          </Badge>
                          {quiz.passed && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Final Exam Result */}
            {courseResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Final Exam Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {courseResult.passed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      <div>
                        <h4 className="font-semibold">Final Examination</h4>
                        <p className="text-sm text-gray-600">
                          Completed {format(new Date(courseResult.completed_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {courseResult.percentage_score}%
                      </div>
                      <Badge 
                        variant={courseResult.passed ? "default" : "destructive"}
                        className={courseResult.passed ? "bg-green-100 text-green-800" : ""}
                      >
                        {courseResult.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseResultsPage;
