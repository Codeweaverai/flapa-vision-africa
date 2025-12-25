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

// Certificate Display Component
const CertificateDisplay: React.FC<{ certificate: Certificate; courseSkills: Record<string, CourseSkill[]> }> = ({ 
  certificate, 
  courseSkills 
}) => {
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [creatorName, setCreatorName] = useState('SkillPulse Instructor');
  const [creatorInitials, setCreatorInitials] = useState('SI');

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (certificate.creator_id) {
        const name = await fetchCreatorName(certificate.creator_id);
        setCreatorName(name);
        setCreatorInitials(getInitials(name));
      }
    };
    fetchCreatorData();
  }, [certificate.creator_id]);

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

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white !important;
          margin: 0;
          padding: 0;
        }
        .certificate-container {
          width: 100% !important;
          height: 100vh !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .qr-section {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 30px !important;
        }
        .signature-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .skills-list {
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          gap: 8px !important;
        }
        .skill-tag {
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
        }
      }
    `,
  });

  const downloadPdfCertificate = () => {
    if (!certificateRef.current) return;

    const input = certificateRef.current;
    const scale = 2;

    html2canvas(input, {
      scale,
      useCORS: true,
      logging: false,
      allowTaint: true,
      width: input.scrollWidth,
      height: input.scrollHeight,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`certificate-${certificate.verification_code}.pdf`);
    });
  };

  const currentDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get skills for this course
  const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
  const coreSkills = skills.filter(skill => skill.is_core_skill);
  const displayedSkills = coreSkills.length > 0 ? coreSkills : skills.slice(0, 4);

  // QR Code data
  const verificationUrl = `https://skillpulse.cloud/verify?code=${certificate.verification_code}`;

  // Founder signature URL
  const founderSignatureUrl = "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/signature.png";

  return (
    <div className="certificate-display">
      {/* Action buttons - Only Download PDF remains */}
      <div className="flex justify-center gap-4 mb-6 no-print">
        <Button
          onClick={downloadPdfCertificate}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Certificate */}
      <div 
        ref={certificateRef}
        className="certificate-container"
        style={{
          width: '794px',
          height: '1123px',
          background: 'white',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto'
        }}
      >
        <div className="certificate-header">
          <div className="header-pattern"></div>
          <div className="logo">
            <div className="logo-icon">
              {/* SkillPulse icon - using the original icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logo-text">SkillPulse</div>
          </div>
          <div className="header-right">
            <div className="certificate-id">Certificate ID: {certificate.verification_code}</div>
            <div className="issue-date">Issued on: {currentDate}</div>
          </div>
        </div>
        
        <div className="certificate-content">
          <div className="watermark">SKILLPULSE</div>
          
          <div className="decoration decoration-1"></div>
          <div className="decoration decoration-2"></div>
          
          <div className="badge">
            {/* Ribbon icon inside the circle - made visible */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="certificate-title">CERTIFICATE OF COMPLETION</h1>
          <p className="subtitle">This certificate is awarded to</p>
          
          <div className="recipient-name">{user?.user_metadata?.full_name || 'Student'}</div>
          
          <p className="message">
            has successfully completed the course requirements and demonstrated proficiency in the following skills:
          </p>
          
          <div className="course-details">
            <div className="course-title">{certificate.course_title}</div>
            <div className="course-info">
              <div className="info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="info-label">Duration:</span>
                <span className="info-value">Self-Paced Learning</span>
              </div>
              <div className="info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="info-label">Level:</span>
                <span className="info-value">Professional</span>
              </div>
              <div className="info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="info-label">Status:</span>
                <span className="info-value">Successfully Completed</span>
              </div>
              <div className="info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="info-label">Completion Date:</span>
                <span className="info-value">{currentDate}</span>
              </div>
            </div>
          </div>
          
          {displayedSkills.length > 0 ? (
            <div className="skills-section">
              <div className="skills-title">Skills Demonstrated</div>
              <div className="skills-list">
                {displayedSkills.map((skill) => (
                  <div key={skill.id} className="skill-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {skill.skill_name}
                    <span className="skill-level">{skill.skill_level}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="skills-section">
              <div className="skills-title">Skills Demonstrated</div>
              <div className="skills-list">
                <div className="skill-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Professional Knowledge
                  <span className="skill-level">Advanced</span>
                </div>
                <div className="skill-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Practical Application
                  <span className="skill-level">Intermediate</span>
                </div>
                <div className="skill-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Professional Competence 
                  <span className="skill-level">Advanced</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="qr-section">
            <div className="signature-container">
              <div className="signature-image">
                <img 
                  src={founderSignatureUrl} 
                  alt="Founder Signature" 
                  style={{ 
                    height: '150px', 
                    maxWidth: '200px',
                    marginBottom: '5px'
                  }} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }} 
                />
              </div>
              <div className="signature-line" style={{ marginTop: '5px' }}></div>
              <div className="signature-name">Mbolela Pule</div>
              <div className="signature-title">Founder & CEO</div>
              <div className="signature-title">SkillPulse Innovations Limited</div>
            </div>
            
            <div className="signature-separator"></div>
            
            <div className="qr-container">
              <QRCodeSVG 
                value={verificationUrl}
                size={100}
                level="M"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            
            <div className="signature-separator"></div>
            
            <div className="signature-container">
              <div className="initials-display">{creatorInitials}</div>
              <div className="zigzag-line"></div>
              <div className="signature-name">{creatorName}</div>
              <div className="signature-title">Course Instructor</div>
              <div className="signature-title">SkillPulse Learning</div>
            </div>
          </div>
          
          <div className="achievement-text">For Excellence in Professional Development & Skill Mastery</div>
          
          <div className="company-name">SkillPulse Innovations Limited</div>
        </div>
        
        <div className="certificate-footer">
          <div className="verification">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Verify this certificate at: skillpulse.cloud/verify/{certificate.verification_code}</span>
          </div>
          
          <div className="social-links no-print">
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="2"/>
                <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2"/>
                <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .certificate-display {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

        .info-item svg {
          color: #6a11cb;
          flex-shrink: 0;
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
          white-space: nowrap;
        }

        .skill-level {
          font-size: 9px;
          background: rgba(255, 255, 255, 0.3);
          padding: 2px 6px;
          border-radius: 8px;
          text-transform: uppercase;
          margin-left: 4px;
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
          height: 70px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signature-line {
          width: 180px;
          height: 1px;
          background: #333;
          margin: 5px auto 8px;
        }

        .zigzag-line {
          width: 150px;
          height: 20px;
          margin: 0 auto 8px;
          background: linear-gradient(135deg, transparent 49%, #333 50%, transparent 51%),
                      linear-gradient(45deg, transparent 49%, #333 50%, transparent 51%);
          background-size: 10px 10px;
          background-repeat: repeat-x;
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

        .initials-display {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
          font-family: 'Brush Script MT', cursive;
          letter-spacing: 2px;
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

        .verification svg {
          color: #6a11cb;
          flex-shrink: 0;
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
          gap: 5px;
          width: 200px;
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

        @media print {
          .no-print {
            display: none !important;
          }
          
          .skills-list {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 8px !important;
          }
          
          .skill-tag {
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
            white-space: nowrap !important;
          }
        }
      `}</style>
    </div>
  );
};

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
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CourseResultsPage;
