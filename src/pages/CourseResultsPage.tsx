
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Award, BookOpen, Download, Calendar, Trophy, Target, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';

interface CourseResult {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnail_url?: string;
    certificate_enabled: boolean;
  };
  final_grade: number;
  passed: boolean;
  completed_at: string;
  quiz_scores: any[] | null;
  percentage_score: number;
  certificate?: {
    id: string;
    verification_code: string;
    pdf_url?: string;
  } | null;
}

const CourseResultsPage = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCourseResults();
    }
  }, [user]);

  const loadCourseResults = async () => {
    try {
      const { data, error } = await supabase
        .from('final_exam_results')
        .select(`
          id,
          final_grade,
          passed,
          completed_at,
          quiz_scores,
          percentage_score,
          course:courses (
            id,
            title,
            thumbnail_url,
            certificate_enabled
          ),
          certificates (
            id,
            verification_code,
            pdf_url
          )
        `)
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedResults: CourseResult[] = (data || []).map(item => ({
        id: item.id,
        final_grade: item.final_grade,
        passed: item.passed,
        completed_at: item.completed_at,
        quiz_scores: Array.isArray(item.quiz_scores) ? item.quiz_scores : [],
        percentage_score: item.percentage_score,
        course: item.course,
        certificate: Array.isArray(item.certificates) && item.certificates.length > 0 
          ? item.certificates[0] 
          : null
      }));
      
      setResults(transformedResults);
    } catch (error) {
      console.error('Error loading course results:', error);
      toast.error('Failed to load course results');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (result: CourseResult) => {
    if (!result.course.certificate_enabled || !result.passed) {
      toast.error('Certificate not available for this course');
      return;
    }

    try {
      setGeneratingCertificate(result.id);

      // Check if certificate already exists
      let certificateId = result.certificate?.id;

      if (!certificateId) {
        // Create certificate record first
        const { data: newCertificate, error: certError } = await supabase
          .from('certificates')
          .insert([{
            user_id: user!.id,
            course_id: result.course.id,
            enrollment_id: result.id, // This should be the actual enrollment ID
            verification_code: `CERT-${Date.now()}`,
            issue_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (certError) throw certError;
        certificateId = newCertificate.id;
      }

      // Generate PDF certificate
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { 
          certificateId: certificateId,
          userId: user!.id 
        }
      });

      if (error) throw error;

      toast.success('Certificate generated successfully!');
      
      // Reload results to get updated certificate
      await loadCourseResults();

      // Open certificate
      if (data.certificateUrl) {
        window.open(data.certificateUrl, '_blank');
      }

    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(null);
    }
  };

  const downloadCertificate = (result: CourseResult) => {
    if (result.certificate?.pdf_url) {
      window.open(result.certificate.pdf_url, '_blank');
    } else {
      generateCertificate(result);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              My Course Results
            </h1>
            <p className="text-gray-600 text-lg">
              View your course completion results and download certificates
            </p>
          </div>

          {results.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="text-center py-16">
                <Trophy className="h-20 w-20 mx-auto mb-6 text-gray-400" />
                <h2 className="text-2xl font-semibold mb-4">No course results yet</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Complete some courses and pass their final exams to see your results here
                </p>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  <a href="/my-courses">View My Courses</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {results.map((result) => (
                <Card key={result.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      {result.course.thumbnail_url && (
                        <img 
                          src={result.course.thumbnail_url} 
                          alt={result.course.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                          {result.course.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Completed on {new Date(result.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={`${
                            result.passed 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-red-500 hover:bg-red-600'
                          } text-white mb-2`}
                        >
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                        {result.passed && result.course.certificate_enabled && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <Award className="h-4 w-4" />
                            <span>Certificate Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Score Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800">Final Grade</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {result.final_grade}%
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">Overall Score</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {result.percentage_score}%
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                          <span className="font-semibold text-orange-800">Quiz Scores</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {result.quiz_scores?.length || 0} completed
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Course Progress</span>
                        <span>{result.percentage_score}%</span>
                      </div>
                      <Progress 
                        value={result.percentage_score} 
                        className="h-3 bg-gray-200"
                      />
                    </div>

                    {/* Quiz Breakdown */}
                    {result.quiz_scores && result.quiz_scores.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Quiz Breakdown</h4>
                        <div className="grid gap-2">
                          {result.quiz_scores.map((quiz: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium">Quiz {index + 1}</span>
                              <Badge variant={quiz.score >= 70 ? "default" : "destructive"}>
                                {quiz.score}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certificate Section */}
                    {result.passed && result.course.certificate_enabled && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <Award className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-purple-800">Certificate of Completion</h4>
                              <p className="text-sm text-purple-600">
                                {result.certificate 
                                  ? `Verification: ${result.certificate.verification_code}`
                                  : 'Generate your certificate to get verification code'
                                }
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadCertificate(result)}
                            disabled={generatingCertificate === result.id}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {generatingCertificate === result.id 
                              ? 'Generating...' 
                              : result.certificate?.pdf_url ? 'Download' : 'Generate'
                            }
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CourseResultsPage;
