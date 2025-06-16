
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface FinalExamResult {
  id: string;
  exam_id: string;
  user_id: string;
  enrollment_id: string;
  course_id: string;
  score: number;
  percentage_score: number;
  passed: boolean;
  attempt_number: number;
  quiz_scores: number[];
  final_grade: number;
  created_at: string;
  completed_at: string;
}

interface Certificate {
  id: string;
  enrollment_id: string;
  verification_code: string;
  pdf_url?: string;
  issue_date: string;
}

const CourseResultsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [examResults, setExamResults] = useState<FinalExamResult[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchData();
    }
  }, [courseId, user]);

  const fetchData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch exam results
      const { data: resultsData, error: resultsError } = await supabase
        .from('final_exam_results')
        .select('*')
        .eq('user_id', user!.id)
        .eq('course_id', courseId)
        .order('attempt_number', { ascending: false });

      if (resultsError) throw resultsError;
      setExamResults(resultsData || []);

      // Fetch certificate
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user!.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentData) {
        const { data: certData } = await supabase
          .from('certificates')
          .select('*')
          .eq('enrollment_id', enrollmentData.id)
          .maybeSingle();

        if (certData) {
          setCertificate(certData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load course results');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!course || !user) return;

    const studentName = user.user_metadata?.full_name || user.email || 'Student';
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const latestResult = examResults[0];
    const finalGrade = latestResult?.final_grade || latestResult?.percentage_score || 0;

    const certificateHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>SkillPulse Certificate</title>
        <style>
            body {
                font-family: 'Georgia', serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
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
            .grade-badge {
                display: inline-block;
                background: linear-gradient(45deg, #f59e0b, #8b5cf6);
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
            }
            .signature {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                flex-wrap: wrap;
                gap: 30px;
            }
            .signature-section {
                flex: 1;
                min-width: 200px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .signature-line {
                border-top: 2px solid #1f2937;
                width: 100%;
                max-width: 200px;
                text-align: center;
                padding-top: 10px;
                font-size: 0.9rem;
                color: #6b7280;
                margin-bottom: 10px;
            }
            .verification {
                margin-top: 30px;
                font-size: 0.8rem;
                color: #9ca3af;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="logo">🎓 SkillPulse</div>
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is to certify that</div>
            <div class="recipient">${studentName}</div>
            <div class="completion">has successfully completed the course</div>
            <div class="course">"${course.title}"</div>
            <div class="grade-badge">Final Grade: ${finalGrade}%</div>
            <div class="completion">demonstrating professional competency and commitment to continuous learning</div>
            <div class="signature">
                <div class="signature-section">
                    <div class="signature-line">
                        <strong>SkillPulse Academy</strong><br>
                        Authorized Signature
                    </div>
                </div>
                <div style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 0.9rem; color: #6b7280; font-weight: bold;">${currentDate}</div>
                    <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">Date of Completion</div>
                </div>
            </div>
            <div class="verification">
                Verification Code: ${certificate?.verification_code || 'SP-GENERATED'}<br>
                This certificate can be verified at skillpulse.com/verify
            </div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course.title.replace(/\s+/g, '_')}_Certificate.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Certificate downloaded successfully!');
  };

  const shareOnLinkedIn = () => {
    if (!course || !examResults.length) return;
    
    const finalGrade = examResults[0]?.final_grade || examResults[0]?.percentage_score || 0;
    const text = `I'm excited to share that I've successfully completed "${course.title}" with a final grade of ${finalGrade}%! 🎓 #ProfessionalDevelopment #SkillPulse #ContinuousLearning`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (!course || !examResults.length) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No results found</h1>
            <Link to="/learning">
              <Button>Back to Learning</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const latestResult = examResults[0];
  const hasPassed = latestResult?.passed;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link to={`/learning/course/${courseId}`} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Course Results</h1>
            <h2 className="text-2xl text-gray-600">{course.title}</h2>
          </div>

          {/* Results Summary */}
          <Card className={`mb-8 ${hasPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                {hasPassed ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">Congratulations! You Passed!</h3>
                      <p className="text-green-600">You have successfully completed the course</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Course Not Completed</h3>
                      <p className="text-red-600">You need 70% or higher to pass</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold mb-2">
                  <span className={hasPassed ? 'text-green-600' : 'text-red-600'}>
                    {latestResult.final_grade || latestResult.percentage_score}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Final Grade</p>
              </div>

              <Progress value={latestResult.final_grade || latestResult.percentage_score} className="h-3 mb-4" />
              
              {hasPassed && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={downloadCertificate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                  <Button onClick={shareOnLinkedIn} variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share on LinkedIn
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Exam History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examResults.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        Attempt {result.attempt_number}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {result.passed ? 'Passed' : 'Failed'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(result.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {result.final_grade || result.percentage_score}%
                      </div>
                      <p className="text-sm text-gray-600">
                        Exam Score: {result.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CourseResultsPage;
