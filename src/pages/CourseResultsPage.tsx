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
  Heart,
  Zap
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
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [courseSkills, setCourseSkills] = useState<Record<string, CourseSkill[]>>({});

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

  const getInitials = (name: string) => {
    if (!name) return 'SI';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const generateCertificateHTML = async (certificate: Certificate) => {
    const currentDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get creator name
    const creatorName = certificate.creator_id ? await fetchCreatorName(certificate.creator_id) : 'SkillPulse Instructor';
    const creatorInitials = getInitials(creatorName);

    // Get skills for this course - FIXED: Add null check
    const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
    const coreSkills = skills.filter(skill => skill.is_core_skill);
    const displayedSkills = coreSkills.length > 0 ? coreSkills : skills.slice(0, 4);

    // QR Code data
    const verificationUrl = `https://skillpulse.cloud/verify?code=${certificate.verification_code}`;

    // Base64 signature for Founder & CEO (placeholder - you can replace with actual signature)
    const founderSignature = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMCA0MEMyMCAyNiAxNCAyMCAyMCAyMEMyNiAyMCAzMCAyNiAzMCA0MEMzMCA1NCAyNiA2MCAyMCA2MEMxNCA2MCAxMCA1NCAxMCA0MEMxMCAyNiAxNCAyMCAyMCAyMFoiIGZpbGw9IiM2YTExY2IiLz48cGF0aCBkPSJNNzAgNDBDNzAgMjYgNjQgMjAgNzAgMjBDNzYgMjAgODAgMjYgODAgNDBDODAgNTQgNzYgNjAgNzAgNjBDNjQgNjAgNjAgNTQgNjAgNDBDNjAgMjYgNjQgMjAgNzAgMjBaIiBmaWxsPSIjZmY3ZTVmIi8+PHBhdGggZD0iTTEyMCA0MEMxMjAgMjYgMTE0IDIwIDEyMCAyMEMxMjYgMjAgMTMwIDI2IDEzMCA0MEMxMzAgNTQgMTI2IDYwIDEyMCA2MEMxMTQgNjAgMTEwIDU0IDExMCA0MEMxMTAgMjYgMTE0IDIwIDEyMCAyMFoiIGZpbGw9IiM2YTExY2IiLz48cGF0aCBkPSJNMTcwIDQwQzE3MCAyNiAxNjQgMjAgMTcwIDIwQzE3NiAyMCAxODAgMjYgMTgwIDQwQzE4MCA1NCAxNzYgNjAgMTcwIDYwQzE2NCA2MCAxNjAgNTQgMTYwIDQwQzE2MCAyNiAxNjQgMjAgMTcwIDIwWiIgZmlsbD0iI2ZmN2U1ZiIvPjwvc3ZnPg==";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SkillPulse Course Completion Certificate</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 20px;
                margin: 0;
            }
            
            @media print {
                body {
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .certificate-container {
                    box-shadow: none !important;
                    border: 1px solid #ddd !important;
                    margin: 0 !important;
                    width: 100% !important;
                    height: 100vh !important;
                    page-break-after: avoid !important;
                    page-break-inside: avoid !important;
                }
                
                .no-print {
                    display: none !important;
                }
                
                @page {
                    margin: 0;
                    size: A4 portrait;
                }
            }
            
            .certificate-container {
                width: 794px; /* A4 width in pixels */
                height: 1123px; /* A4 height in pixels */
                background: white;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                border-radius: 8px;
                overflow: hidden;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            
            .certificate-header {
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                padding: 20px 40px;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                overflow: hidden;
                min-height: 100px;
            }
            
            .header-pattern {
                position: absolute;
                top: 0;
                right: 0;
                width: 200px;
                height: 100%;
                background: rgba(255, 255, 255, 0.1);
                clip-path: polygon(100% 0, 100% 100%, 0 100%, 30% 0);
            }
            
            .logo {
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 2;
            }
            
            .logo-icon {
                font-size: 28px;
                background: rgba(255, 255, 255, 0.2);
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .logo-text {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 1px;
            }
            
            .header-right {
                text-align: right;
                z-index: 2;
            }
            
            .certificate-id {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 5px;
            }
            
            .issue-date {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .certificate-content {
                padding: 30px 50px;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                min-height: calc(1123px - 100px);
            }
            
            .certificate-title {
                font-size: 32px;
                font-weight: 300;
                color: #333;
                text-align: center;
                margin-bottom: 10px;
                letter-spacing: 2px;
            }
            
            .subtitle {
                font-size: 16px;
                color: #666;
                text-align: center;
                margin-bottom: 20px;
                font-weight: 400;
            }
            
            .recipient-name {
                font-size: 42px;
                font-weight: 600;
                color: #333;
                text-align: center;
                margin: 20px 0;
                padding: 15px 0;
                background: linear-gradient(90deg, rgba(255,126,95,0.1), rgba(106,17,203,0.1));
                border-radius: 8px;
                position: relative;
            }
            
            .recipient-name:before, .recipient-name:after {
                content: "";
                position: absolute;
                height: 3px;
                width: 80px;
                background: linear-gradient(90deg, #ff7e5f, #6a11cb);
                top: 0;
            }
            
            .recipient-name:after {
                top: auto;
                bottom: 0;
            }
            
            .message {
                font-size: 16px;
                color: #555;
                line-height: 1.5;
                text-align: center;
                max-width: 700px;
                margin: 0 auto 25px;
            }
            
            .course-details {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #6a11cb;
            }
            
            .course-title {
                font-size: 20px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
                text-align: center;
            }
            
            .course-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 12px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .info-item i {
                color: #6a11cb;
                font-size: 16px;
            }
            
            .info-label {
                font-weight: 600;
                color: #555;
                min-width: 100px;
            }
            
            .info-value {
                color: #333;
            }
            
            .skills-section {
                margin: 20px 0;
            }
            
            .skills-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin-bottom: 12px;
                text-align: center;
            }
            
            .skills-list {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 8px;
            }
            
            .skill-tag {
                background: linear-gradient(135deg, #ff7e5f, #6a11cb);
                color: white;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .skill-level {
                font-size: 9px;
                background: rgba(255, 255, 255, 0.3);
                padding: 2px 6px;
                border-radius: 8px;
                text-transform: uppercase;
            }
            
            .signature-area {
                display: flex;
                justify-content: space-between;
                margin-top: 25px;
                align-items: flex-end;
            }
            
            .signature {
                text-align: center;
                width: 45%;
            }
            
            .signature-image {
                height: 60px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .signature-line {
                width: 180px;
                height: 1px;
                background: #333;
                margin: 0 auto 8px;
            }
            
            .signature-name {
                font-weight: 600;
                color: #333;
                margin-bottom: 4px;
                font-size: 16px;
            }
            
            .signature-title {
                font-size: 12px;
                color: #666;
                line-height: 1.3;
            }
            
            .initials-signature {
                width: 120px;
                height: 50px;
                background: linear-gradient(135deg, #6a11cb, #2575fc);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                font-weight: bold;
                margin: 0 auto 8px;
                border: 2px solid #6a11cb;
            }
            
            .certificate-footer {
                background: #f8f9fa;
                padding: 15px 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #eaeaea;
                margin-top: auto;
            }
            
            .verification {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #666;
                font-size: 12px;
            }
            
            .verification i {
                color: #6a11cb;
            }
            
            .social-links {
                display: flex;
                gap: 12px;
            }
            
            .social-links a {
                color: #666;
                font-size: 16px;
                transition: color 0.3s;
            }
            
            .social-links a:hover {
                color: #6a11cb;
            }
            
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                font-weight: 900;
                color: rgba(106, 17, 203, 0.05);
                z-index: 0;
                white-space: nowrap;
                pointer-events: none;
            }
            
            .decoration {
                position: absolute;
                z-index: 0;
            }
            
            .decoration-1 {
                top: 40px;
                left: 40px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(255,126,95,0.1), rgba(106,17,203,0.1));
            }
            
            .decoration-2 {
                bottom: 40px;
                right: 40px;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(106,17,203,0.1), rgba(255,126,95,0.1));
            }
            
            .badge {
                position: absolute;
                top: 30px;
                right: 50px;
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #ff7e5f, #6a11cb);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 28px;
                box-shadow: 0 5px 15px rgba(106, 17, 203, 0.3);
                z-index: 1;
            }
            
            .achievement-text {
                text-align: center;
                margin-top: 8px;
                color: #6a11cb;
                font-weight: 600;
                font-size: 14px;
            }
            
            .company-name {
                text-align: center;
                margin-top: 15px;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .qr-section {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 30px;
                margin: 15px 0;
            }
            
            .qr-container {
                background: white;
                padding: 12px;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border: 1px solid #eaeaea;
            }
            
            .qr-code {
                width: 100px;
                height: 100px;
            }
            
            .signature-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .signature-separator {
                width: 2px;
                height: 80px;
                background: linear-gradient(to bottom, #ff7e5f, #6a11cb);
                margin: 0 20px;
            }
            
            @media (max-width: 850px) {
                .certificate-container {
                    width: 100%;
                    height: auto;
                }
                
                .certificate-content {
                    padding: 20px;
                }
                
                .recipient-name {
                    font-size: 32px;
                }
                
                .certificate-title {
                    font-size: 24px;
                }
                
                .course-info {
                    grid-template-columns: 1fr;
                }
                
                .signature-area {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .signature {
                    width: 100%;
                }
                
                .qr-section {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .signature-separator {
                    width: 80px;
                    height: 2px;
                    margin: 10px 0;
                }
            }
            
            @media (max-width: 480px) {
                .certificate-header {
                    padding: 15px;
                    flex-direction: column;
                    gap: 10px;
                    text-align: center;
                }
                
                .header-right {
                    text-align: center;
                }
                
                .recipient-name {
                    font-size: 24px;
                    padding: 10px 0;
                }
                
                .certificate-title {
                    font-size: 20px;
                }
                
                .course-details {
                    padding: 15px;
                }
                
                .skills-list {
                    gap: 6px;
                }
                
                .skill-tag {
                    font-size: 10px;
                    padding: 4px 8px;
                }
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            <div class="certificate-header">
                <div class="header-pattern"></div>
                <div class="logo">
                    <div class="logo-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="logo-text">SkillPulse</div>
                </div>
                <div class="header-right">
                    <div class="certificate-id">Certificate ID: ${certificate.verification_code}</div>
                    <div class="issue-date">Issued on: ${currentDate}</div>
                </div>
            </div>
            
            <div class="certificate-content">
                <div class="watermark">SKILLPULSE INNOVATIONS</div>
                
                <div class="decoration decoration-1"></div>
                <div class="decoration decoration-2"></div>
                
                <div class="badge">
                    <i class="fas fa-award"></i>
                </div>
                
                <h1 class="certificate-title">CERTIFICATE OF COMPLETION</h1>
                <p class="subtitle">This certificate is awarded to</p>
                
                <div class="recipient-name">${user?.user_metadata?.full_name || 'Student'}</div>
                
                <p class="message">
                    has successfully completed the course requirements and demonstrated proficiency in the following skills:
                </p>
                
                <div class="course-details">
                    <div class="course-title">${certificate.course_title}</div>
                    <div class="course-info">
                        <div class="info-item">
                            <i class="far fa-clock"></i>
                            <span class="info-label">Duration:</span>
                            <span class="info-value">Self-Paced Learning</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-chart-line"></i>
                            <span class="info-label">Level:</span>
                            <span class="info-value">Professional</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-trophy"></i>
                            <span class="info-label">Status:</span>
                            <span class="info-value">Successfully Completed</span>
                        </div>
                        <div class="info-item">
                            <i class="far fa-calendar-alt"></i>
                            <span class="info-label">Completion Date:</span>
                            <span class="info-value">${currentDate}</span>
                        </div>
                    </div>
                </div>
                
                ${displayedSkills.length > 0 ? `
                <div class="skills-section">
                    <div class="skills-title">Skills Demonstrated</div>
                    <div class="skills-list">
                        ${displayedSkills.map(skill => `
                            <div class="skill-tag">
                                <i class="fas fa-bolt"></i>
                                ${skill.skill_name}
                                <span class="skill-level">${skill.skill_level}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : `
                <div class="skills-section">
                    <div class="skills-title">Skills Demonstrated</div>
                    <div class="skills-list">
                        <div class="skill-tag">
                            <i class="fas fa-bolt"></i>
                            Professional Knowledge
                            <span class="skill-level">Advanced</span>
                        </div>
                        <div class="skill-tag">
                            <i class="fas fa-bolt"></i>
                            Practical Application
                            <span class="skill-level">Intermediate</span>
                        </div>
                        <div class="skill-tag">
                            <i class="fas fa-bolt"></i>
                            Critical Thinking
                            <span class="skill-level">Advanced</span>
                        </div>
                    </div>
                </div>
                `}
                
                <div class="qr-section">
                    <div class="signature-container">
                        <div class="signature-image">
                            <img src="${founderSignature}" alt="Founder Signature" style="height: 50px;" />
                        </div>
                        <div class="signature-line"></div>
                        <div class="signature-name">Mbolela Pule</div>
                        <div class="signature-title">Founder & CEO</div>
                        <div class="signature-title">SkillPulse Innovations Limited</div>
                    </div>
                    
                    <div class="signature-separator"></div>
                    
                    <div class="qr-container">
                        <div id="qr-code" class="qr-code"></div>
                    </div>
                    
                    <div class="signature-separator"></div>
                    
                    <div class="signature-container">
                        <div class="initials-signature">${creatorInitials}</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">${creatorName}</div>
                        <div class="signature-title">Course Instructor</div>
                        <div class="signature-title">SkillPulse Academy</div>
                    </div>
                </div>
                
                <div class="achievement-text">For Excellence in Professional Development & Skill Mastery</div>
                
                <div class="company-name">SkillPulse Innovations Limited</div>
            </div>
            
            <div class="certificate-footer">
                <div class="verification">
                    <i class="fas fa-shield-alt"></i>
                    <span>Verify this certificate at: skillpulse.cloud/verify/${certificate.verification_code}</span>
                </div>
                
                <div class="social-links no-print">
                    <a href="#"><i class="fab fa-linkedin"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-facebook"></i></a>
                </div>
            </div>
        </div>
        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        <script>
            // Generate QR Code after page loads
            window.addEventListener('load', function() {
                const qrContainer = document.getElementById('qr-code');
                const verificationUrl = '${verificationUrl}';
                
                // Create QR Code using qrcode.js library
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, {
                        text: verificationUrl,
                        width: 100,
                        height: 100,
                        colorDark: "#1f2937",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } else {
                    qrContainer.innerHTML = '<div style="width: 100px; height: 100px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #6b7280; text-align: center;">QR Code<br>Not Available</div>';
                }
            });
            
            // Auto-print when opened in print view
            if (window.location.search.includes('print=true')) {
                setTimeout(() => {
                    window.print();
                }, 1000);
            }
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
          // Don't close immediately to allow user to see print dialog
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
    const newWindow = window.open('', '_blank', 'width=900,height=800');
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
                                  Print
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
    </Layout>
  );
};

export default CourseResultsPage;
