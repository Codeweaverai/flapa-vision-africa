
import React, { useState, useEffect } from 'react';
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
}

const CourseResultsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

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
        const transformedResults: ExamResult[] = resultsData?.map(result => {
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
        
        setExamResults(transformedResults);
      }

      // Fetch certificates with better error handling
      const { data: userEnrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id, course_id, courses!course_enrollments_course_id_fkey(title, creator_id)')
        .eq('user_id', user!.id);

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError);
      } else if (userEnrollments && userEnrollments.length > 0) {
        const enrollmentIds = userEnrollments.map(e => e.id);
        
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
            const enrollment = userEnrollments.find(e => e.id === cert.enrollment_id);
            return {
              id: cert.id,
              verification_code: cert.verification_code,
              issue_date: cert.issue_date,
              pdf_url: cert.pdf_url || undefined,
              course_title: enrollment?.courses?.title || 'Course Certificate',
              creator_id: enrollment?.courses?.creator_id
            };
          }) || [];
          
          setCertificates(transformedCertificates);
        }
      }

    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorName = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', creatorId)
        .single();
      
      if (error) {
        console.error('Error fetching creator name:', error);
        return 'SkillPulse Instructor';
      }
      
      return data?.full_name || 'SkillPulse Instructor';
    } catch (error) {
      console.error('Error fetching creator name:', error);
      return 'SkillPulse Instructor';
    }
  };

  // Convert image URL to base64
  const getImageAsBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const generateCertificateHTML = async (certificate: Certificate) => {
    const currentDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get creator name
    const creatorName = certificate.creator_id ? await fetchCreatorName(certificate.creator_id) : 'SkillPulse Instructor';

    // Get director signature as base64
    const signatureImageUrl = 'https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/certificates//d321231f-c3fb-46f0-b19f-2884efd3da99.png';
    const signatureBase64 = await getImageAsBase64(signatureImageUrl);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>SkillPulse Certificate</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Georgia', serif;
                background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .certificate {
                background: white;
                padding: 60px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 800px;
                width: 100%;
                text-align: center;
                border: 8px solid #f59e0b;
                position: relative;
                margin: auto;
            }
            
            .certificate::before {
                content: '';
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                border: 2px solid #8b5cf6;
                border-radius: 12px;
                pointer-events: none;
            }
            
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                background: linear-gradient(45deg, #f59e0b, #8b5cf6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 20px;
            }
            
            .title {
                font-size: 3rem;
                color: #1f2937;
                margin: 20px 0;
                font-weight: normal;
            }
            
            .subtitle {
                font-size: 1.2rem;
                color: #6b7280;
                margin-bottom: 40px;
            }
            
            .recipient {
                font-size: 2.5rem;
                color: #f59e0b;
                font-weight: bold;
                margin: 30px 0;
                text-decoration: underline;
                text-decoration-color: #8b5cf6;
            }
            
            .course {
                font-size: 1.8rem;
                color: #1f2937;
                margin: 30px 0;
                font-style: italic;
            }
            
            .completion {
                font-size: 1.1rem;
                color: #6b7280;
                margin: 20px 0;
            }
            
            .creator-section {
                font-size: 1.1rem;
                color: #6b7280;
                margin: 30px 0;
                text-align: center;
            }
            
            .creator-name {
                font-size: 1.3rem;
                color: #1f2937;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .signature {
                margin-top: 50px;
                display: flex;
                justify-content: center;
                align-items: flex-end;
                flex-wrap: wrap;
                gap: 30px;
            }
            
            .signature-section {
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .signature-image {
                width: 200px;
                height: 100px;
                margin-bottom: 10px;
                border-radius: 8px;
            }
            
            .signature-line {
                border-top: 2px solid #1f2937;
                width: 100%;
                max-width: 250px;
                text-align: center;
                padding-top: 10px;
                font-size: 0.9rem;
                color: #6b7280;
                margin-bottom: 10px;
            }
            
            .date-section {
                text-align: center;
                margin-top: 30px;
            }
            
            .verification {
                margin-top: 30px;
                font-size: 0.8rem;
                color: #9ca3af;
                text-align: center;
            }
            
            @media print {
                body {
                    background: white !important;
                    padding: 0 !important;
                }
                
                .certificate {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    max-width: none !important;
                    width: 100% !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="logo">🎓 SkillPulse</div>
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is to certify that</div>
            <div class="recipient">${user?.user_metadata?.full_name || 'Student'}</div>
            <div class="completion">has successfully completed the course</div>
            <div class="course">"${certificate.course_title}"</div>
            <div class="completion">demonstrating professional competency and commitment to continuous learning</div>
            
            <div class="creator-section">
                <div class="completion">Course Instructor:</div>
                <div class="creator-name">${creatorName}</div>
            </div>
            
            <div class="signature">
                <div class="signature-section">
                    ${signatureBase64 ? `<img src="${signatureBase64}" alt="Director Signature" class="signature-image" />` : ''}
                    <div class="signature-line">
                        <strong>Mbolela Pule</strong><br>
                        Director Learning - SkillPulse<br>
                        Digital Technologies Limited
                    </div>
                </div>
            </div>
            
            <div class="date-section">
                <div style="font-size: 0.9rem; color: #6b7280; font-weight: bold;">${currentDate}</div>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">Date of Completion</div>
            </div>
            
            <div class="verification">
                Verification Code: ${certificate.verification_code}<br>
                This certificate can be verified at skillpulse.com/verify-certificate
            </div>
        </div>
    </body>
    </html>
    `;
  };

  const printCertificate = async (certificate: Certificate) => {
    try {
      const certificateHTML = await generateCertificateHTML(certificate);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast.error('Please allow popups to print the certificate');
        return;
      }
      
      printWindow.document.write(certificateHTML);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
      toast.success('Certificate is ready to print!');
    } catch (error) {
      console.error('Error printing certificate:', error);
      toast.error('Failed to print certificate');
    }
  };

  const viewCertificate = async (certificate: Certificate) => {
    const html = await generateCertificateHTML(certificate);
    const newWindow = window.open('', '_blank', 'width=900,height=700');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
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
                              <h3 className="font-semibold">{certificate.course_title}</h3>
                              <p className="text-sm text-gray-600">
                                Verification: {certificate.verification_code}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => viewCertificate(certificate)}
                              size="sm"
                              variant="outline"
                              className="border-orange-300 text-orange-700 hover:bg-orange-100"
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => printCertificate(certificate)}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Print PDF
                            </Button>
                          </div>
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
