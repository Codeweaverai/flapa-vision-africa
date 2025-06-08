
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface ExamResult {
  id: string;
  score: number;
  percentage_score: number;
  passed: boolean;
  quiz_scores: number[];
  final_grade: number;
  completed_at: string;
  course: {
    title: string;
    thumbnail_url?: string;
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
}

const CourseResultsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadResults();
  }, [user]);

  const loadResults = async () => {
    try {
      // Fetch exam results
      const { data: resultsData, error: resultsError } = await supabase
        .from('final_exam_results')
        .select(`
          *,
          course:courses(title, thumbnail_url),
          exam:final_exams(title, passing_score)
        `)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false });

      if (resultsError) throw resultsError;
      
      // Transform the data to match our interface with proper type handling
      const transformedResults: ExamResult[] = [];
      
      if (resultsData) {
        for (const result of resultsData) {
          const quizScores = result.quiz_scores;
          let parsedQuizScores: number[] = [];
          
          if (Array.isArray(quizScores)) {
            parsedQuizScores = quizScores.filter((score): score is number => typeof score === 'number');
          }
          
          transformedResults.push({
            id: result.id,
            score: result.score,
            percentage_score: result.percentage_score,
            passed: result.passed,
            quiz_scores: parsedQuizScores,
            final_grade: result.final_grade,
            completed_at: result.completed_at,
            course: {
              title: result.course?.title || 'Unknown Course',
              thumbnail_url: result.course?.thumbnail_url
            },
            exam: {
              title: result.exam?.title || 'Final Exam',
              passing_score: result.exam?.passing_score || 70
            }
          });
        }
      }
      
      setExamResults(transformedResults);

      // Fetch certificates
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user!.id)
        .order('issue_date', { ascending: false });

      if (certificatesError) throw certificatesError;
      setCertificates(certificatesData || []);

    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificate: Certificate) => {
    if (certificate.pdf_url) {
      window.open(certificate.pdf_url, '_blank');
    } else {
      toast.info('Certificate is being generated. Please check back later.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
          <div className="container mx-auto px-4 py-16">
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Your Course Results
            </h1>
            <p className="text-center text-gray-600 text-lg">
              Track your progress and achievements
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Exam Results */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-purple-600" />
                    Exam Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {examResults.length > 0 ? (
                    examResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          result.passed
                            ? 'bg-green-50 border-green-500'
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            {result.course.title}
                          </h3>
                          <Badge
                            variant={result.passed ? 'default' : 'destructive'}
                            className={result.passed ? 'bg-green-500' : ''}
                          >
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {result.percentage_score}%
                            </div>
                            <div className="text-sm text-gray-500">Exam Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {result.final_grade}%
                            </div>
                            <div className="text-sm text-gray-500">Final Grade</div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Quiz Average</span>
                            <span>
                              {result.quiz_scores.length > 0
                                ? Math.round(result.quiz_scores.reduce((a, b) => a + b, 0) / result.quiz_scores.length)
                                : 0}%
                            </span>
                          </div>
                          <Progress
                            value={
                              result.quiz_scores.length > 0
                                ? result.quiz_scores.reduce((a, b) => a + b, 0) / result.quiz_scores.length
                                : 0
                            }
                            className="h-2"
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(result.completed_at).toLocaleDateString()}
                          </span>
                          <span>
                            Passing: {result.exam.passing_score}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No exam results yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Certificates */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-orange-600" />
                    Certificates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {certificates.length > 0 ? (
                    certificates.map((certificate) => (
                      <div
                        key={certificate.id}
                        className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-8 w-8 text-orange-600" />
                            <div>
                              <h3 className="font-semibold">Certificate of Completion</h3>
                              <p className="text-sm text-gray-600">
                                Verification: {certificate.verification_code}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadCertificate(certificate)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Issued on {new Date(certificate.issue_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No certificates earned yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Complete courses to earn certificates
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overall Statistics */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    Overall Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {examResults.filter(r => r.passed).length}
                      </div>
                      <div className="text-sm text-gray-600">Courses Completed</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {examResults.length > 0
                          ? Math.round(examResults.reduce((sum, r) => sum + r.final_grade, 0) / examResults.length)
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Average Grade</div>
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

export default CourseResultsPage;
