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
  Target,
  BookOpen,
  Users,
  Clock,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

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

    // QR Code data
    const verificationUrl = `https://skillpulse.cloud/verify?code=${certificate.verification_code}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>SkillPulse Certificate</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #f97316 0%, #8b5cf6 50%, #ec4899 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
            }
            
            .certificate-container {
                background: linear-gradient(145deg, #ffffff, #f8fafc);
                padding: 60px 40px;
                border-radius: 24px;
                box-shadow: 
                    0 25px 50px -12px rgba(0, 0, 0, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.1),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
                max-width: 1000px;
                width: 100%;
                text-align: center;
                position: relative;
                overflow: hidden;
                margin: auto;
            }
            
            .certificate-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 8px;
                background: linear-gradient(90deg, #f97316, #8b5cf6, #ec4899);
            }
            
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 120px;
                font-weight: 900;
                color: rgba(249, 115, 22, 0.03);
                z-index: 0;
                white-space: nowrap;
                font-family: 'Playfair Display', serif;
            }
            
            .certificate-content {
                position: relative;
                z-index: 1;
            }
            
            .header {
                margin-bottom: 40px;
            }
            
            .logo {
                font-size: 3rem;
                font-weight: 800;
                background: linear-gradient(135deg, #f97316, #8b5cf6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 16px;
                font-family: 'Playfair Display', serif;
                letter-spacing: 2px;
            }
            
            .sub-logo {
                font-size: 1.1rem;
                color: #6b7280;
                font-weight: 500;
                letter-spacing: 3px;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            
            .title {
                font-size: 3.5rem;
                color: #1f2937;
                margin: 30px 0;
                font-weight: 700;
                font-family: 'Playfair Display', serif;
                position: relative;
                display: inline-block;
            }
            
            .title::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 25%;
                right: 25%;
                height: 3px;
                background: linear-gradient(90deg, #f97316, #8b5cf6);
                border-radius: 2px;
            }
            
            .subtitle {
                font-size: 1.3rem;
                color: #6b7280;
                margin-bottom: 40px;
                font-weight: 400;
                line-height: 1.6;
            }
            
            .recipient {
                font-size: 2.8rem;
                color: #f97316;
                font-weight: 700;
                margin: 40px 0;
                font-family: 'Playfair Display', serif;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
                display: inline-block;
            }
            
            .recipient::before,
            .recipient::after {
                content: '"';
                font-size: 4rem;
                color: #8b5cf6;
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0.3;
            }
            
            .recipient::before {
                left: -40px;
            }
            
            .recipient::after {
                right: -40px;
            }
            
            .course {
                font-size: 2rem;
                color: #1f2937;
                margin: 30px 0;
                font-style: italic;
                font-weight: 600;
                background: linear-gradient(135deg, #fef3c7, #ede9fe);
                padding: 20px 40px;
                border-radius: 16px;
                display: inline-block;
                border-left: 4px solid #f97316;
            }
            
            .completion {
                font-size: 1.2rem;
                color: #6b7280;
                margin: 30px 0;
                line-height: 1.8;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .creator-section {
                margin: 40px 0;
                padding: 30px;
                background: linear-gradient(135deg, #fffbeb, #faf5ff);
                border-radius: 16px;
                border: 1px solid rgba(249, 115, 22, 0.2);
            }
            
            .creator-name {
                font-size: 1.5rem;
                color: #1f2937;
                font-weight: 600;
                margin: 10px 0;
            }
            
            .signature-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin: 50px 0 30px;
                flex-wrap: wrap;
                gap: 40px;
            }
            
            .signature {
                text-align: center;
                flex: 1;
                min-width: 200px;
            }
            
            .signature-image {
                width: 180px;
                height: 80px;
                margin-bottom: 15px;
                border-radius: 8px;
                filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
            }
            
            .signature-line {
                border-top: 2px solid #1f2937;
                width: 100%;
                max-width: 200px;
                text-align: center;
                padding-top: 12px;
                font-size: 0.9rem;
                color: #6b7280;
                margin: 0 auto;
                font-weight: 500;
            }
            
            .qr-section {
                text-align: center;
                flex: 1;
                min-width: 200px;
            }
            
            .qr-container {
                background: white;
                padding: 20px;
                border-radius: 12px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                margin-bottom: 15px;
                border: 1px solid #e5e7eb;
            }
            
            .verification {
                font-size: 0.85rem;
                color: #6b7280;
                margin-top: 10px;
                line-height: 1.4;
            }
            
            .date-section {
                text-align: center;
                margin: 40px 0 20px;
                padding-top: 30px;
                border-top: 2px dashed #e5e7eb;
            }
            
            .date {
                font-size: 1.1rem;
                color: #1f2937;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                font-size: 0.8rem;
                color: #9ca3af;
                line-height: 1.6;
            }
            
            .certificate-id {
                font-family: 'Courier New', monospace;
                font-weight: 600;
                color: #f97316;
                letter-spacing: 1px;
            }
            
            @media print {
                body {
                    background: white !important;
                    padding: 0 !important;
                }
                
                .certificate-container {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    max-width: none !important;
                    width: 100% !important;
                    padding: 40px 20px !important;
                }
                
                .watermark {
                    opacity: 0.1 !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            <div class="watermark">SKILLPULSE</div>
            
            <div class="certificate-content">
                <div class="header">
                    <div class="logo">🎓 SkillPulse</div>
                    <div class="sub-logo">Digital Technologies Limited</div>
                    <div class="title">Certificate of Completion</div>
                    <div class="subtitle">This is to certify that</div>
                </div>
                
                <div class="recipient">${user?.user_metadata?.full_name || 'Student'}</div>
                
                <div class="completion">has successfully completed the course and demonstrated exceptional proficiency in</div>
                
                <div class="course">"${certificate.course_title}"</div>
                
                <div class="completion">
                    This achievement recognizes dedication to professional development and mastery of course material, 
                    demonstrating commitment to continuous learning and skill enhancement.
                </div>
                
                <div class="creator-section">
                    <div style="font-size: 1rem; color: #6b7280; margin-bottom: 8px;">Course Instructor</div>
                    <div class="creator-name">${creatorName}</div>
                    <div style="font-size: 0.9rem; color: #9ca3af;">Certified SkillPulse Instructor</div>
                </div>
                
                <div class="signature-section">
                    <div class="signature">
                        ${signatureBase64 ? `<img src="${signatureBase64}" alt="Director Signature" class="signature-image" />` : ''}
                        <div class="signature-line">
                            <strong>Mbolela Pule</strong><br>
                            Director of Learning<br>
                            SkillPulse Digital Technologies
                        </div>
                    </div>
                    
                    <div class="qr-section">
                        <div class="qr-container">
                            <!-- QR Code will be generated by JavaScript -->
                            <div id="qr-code" style="width: 120px; height: 120px;"></div>
                        </div>
                        <div class="verification">
                            Scan to verify at:<br>
                            <strong>skillpulse.cloud/verify</strong><br>
                            Code: <span class="certificate-id">${certificate.verification_code}</span>
                        </div>
                    </div>
                </div>
                
                <div class="date-section">
                    <div class="date">${currentDate}</div>
                    <div style="font-size: 0.9rem; color: #9ca3af;">Date of Completion</div>
                </div>
                
                <div class="footer">
                    This certificate is issued by SkillPulse Digital Technologies Limited and can be verified online.<br>
                    Certificate ID: <span class="certificate-id">${certificate.verification_code}</span> • Issued on ${currentDate}
                </div>
            </div>
        </div>
        
        <script>
            // Generate QR Code after page loads
            window.addEventListener('load', function() {
                const qrContainer = document.getElementById('qr-code');
                const verificationUrl = '${verificationUrl}';
                
                // Create QR Code using qrcode.js library (you'll need to include this)
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, {
                        text: verificationUrl,
                        width: 120,
                        height: 120,
                        colorDark: "#1f2937",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } else {
                    qrContainer.innerHTML = '<div style="width: 120px; height: 120px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280; text-align: center;">QR Code<br>Not Available</div>';
                }
            });
        </script>
    </body>
    </html>
    `;
  };

  const printCertificate = async (certificate: Certificate) => {
    try {
      const certificateHTML = await generateCertificateHTML(certificate);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      
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
        }, 1000);
      };
      
      toast.success('Certificate is ready to print!');
    } catch (error) {
      console.error('Error printing certificate:', error);
      toast.error('Failed to print certificate');
    }
  };

  const viewCertificate = async (certificate: Certificate) => {
    const html = await generateCertificateHTML(certificate);
    const newWindow = window.open('', '_blank', 'width=1000,height=800');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  // Calculate statistics
  const totalCourses = examResults.length;
  const passedCourses = examResults.filter(r => r.passed).length;
  const averageGrade = examResults.length > 0
    ? Math.round(examResults.reduce((sum, r) => sum + r.final_grade, 0) / examResults.length)
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
                                {result.percentage_score}%
                              </div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Exam Score</div>
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
                              <span className="text-gray-600">Quiz Performance</span>
                              <span className="font-medium">
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
                              className={`h-2 ${
                                result.passed ? 'bg-green-200' : 'bg-red-200'
                              }`}
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
                      certificates.map((certificate) => (
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
                                onClick={() => viewCertificate(certificate)}
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => printCertificate(certificate)}
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
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
    </Layout>
  );
};

export default CourseResultsPage;
