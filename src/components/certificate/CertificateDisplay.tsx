import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Download, Calendar, Award } from 'lucide-react';

interface CourseSkill {
  id: string;
  skill_name: string;
  skill_description?: string;
  skill_level: string;
  order_index: number;
  is_core_skill: boolean;
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

interface CertificateDisplayProps {
  certificate: Certificate;
  courseSkills: Record<string, CourseSkill[]>;
  showActions?: boolean; // Whether to show download/share buttons
}

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  certificate,
  courseSkills,
  showActions = true
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
      {showActions && (
        <div className="flex justify-center gap-4 mb-6 no-print">
          <Button
            onClick={downloadPdfCertificate}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}

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

export default CertificateDisplay;