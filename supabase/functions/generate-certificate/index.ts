
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  grade: number;
  score: number;
  certificateId: string;
  userId: string;
  courseId: string;
}

const generateVerificationCode = (): string => {
  const prefix = 'SP';
  const part1 = Math.random().toString(36).substring(2, 10).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${part1}-${part2}`;
};

const generateCertificateHTML = (data: CertificateData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .certificate {
          background: white;
          width: 800px;
          padding: 60px;
          text-align: center;
          border: 10px solid #2c3e50;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          position: relative;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 3px solid #3498db;
          border-radius: 10px;
        }
        .header {
          margin-bottom: 40px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .title {
          font-size: 48px;
          font-weight: bold;
          color: #2c3e50;
          margin: 30px 0;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        .subtitle {
          font-size: 18px;
          color: #7f8c8d;
          margin-bottom: 40px;
        }
        .student-name {
          font-size: 36px;
          color: #3498db;
          font-weight: bold;
          margin: 30px 0;
          border-bottom: 3px solid #3498db;
          display: inline-block;
          padding-bottom: 10px;
        }
        .course-name {
          font-size: 24px;
          color: #2c3e50;
          margin: 20px 0;
          font-style: italic;
        }
        .details {
          margin: 40px 0;
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
        }
        .detail-item {
          text-align: center;
          margin: 10px;
        }
        .detail-label {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: bold;
          text-transform: uppercase;
        }
        .detail-value {
          font-size: 18px;
          color: #2c3e50;
          font-weight: bold;
          margin-top: 5px;
        }
        .signature-section {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .signature {
          text-align: center;
          flex: 1;
        }
        .signature-line {
          border-top: 2px solid #2c3e50;
          width: 200px;
          margin: 0 auto 10px auto;
        }
        .signature-title {
          font-size: 14px;
          color: #2c3e50;
          font-weight: bold;
        }
        .date-section {
          text-align: center;
          flex: 1;
        }
        .certificate-id {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 12px;
          color: #7f8c8d;
        }
        .verification-code {
          position: absolute;
          bottom: 20px;
          left: 30px;
          font-size: 12px;
          color: #7f8c8d;
          font-weight: bold;
        }
        .seal {
          position: absolute;
          top: 80px;
          right: 80px;
          width: 100px;
          height: 100px;
          background: #3498db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="seal">
          SKILL<br>PULSE<br>CERTIFIED
        </div>
        
        <div class="header">
          <div class="logo">🎓 SkillPulse Academy</div>
          <div class="title">Certificate of Completion</div>
          <div class="subtitle">This is to certify that</div>
        </div>
        
        <div class="student-name">${data.studentName}</div>
        
        <div class="subtitle">has successfully completed the course</div>
        
        <div class="course-name">"${data.courseName}"</div>
        
        <div class="details">
          <div class="detail-item">
            <div class="detail-label">Completion Date</div>
            <div class="detail-value">${new Date(data.completionDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Final Grade</div>
            <div class="detail-value">${data.grade}%</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Score</div>
            <div class="detail-value">${data.score}/100</div>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-title">Director, SkillPulse Academy</div>
            <div class="signature-title">Authorized Signature</div>
          </div>
          
          <div class="date-section">
            <div class="detail-label">Date Issued</div>
            <div class="detail-value">${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
        </div>
        
        <div class="verification-code">Verification: ${data.certificateId}</div>
        <div class="certificate-id">Certificate ID: ${data.certificateId}</div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, courseId, enrollmentId } = await req.json()

    // Get user and course details
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('final_exam_results')
      .select(`
        *,
        course:courses(title),
        user:profiles(full_name)
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('enrollment_id', enrollmentId)
      .eq('passed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (enrollmentError || !enrollment) {
      throw new Error('Exam result not found or student has not passed')
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('enrollment_id', enrollmentId)
      .single()

    if (existingCert && existingCert.pdf_url) {
      return new Response(
        JSON.stringify({
          success: true,
          certificateUrl: existingCert.pdf_url,
          verificationCode: existingCert.verification_code,
          message: 'Certificate already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique verification code
    const verificationCode = generateVerificationCode()
    
    // Prepare certificate data
    const certificateData: CertificateData = {
      studentName: enrollment.user?.full_name || 'Student',
      courseName: enrollment.course?.title || 'Course',
      completionDate: enrollment.completed_at,
      grade: enrollment.final_grade,
      score: enrollment.score,
      certificateId: verificationCode,
      userId,
      courseId
    }

    // Generate HTML
    const htmlContent = generateCertificateHTML(certificateData)

    // For demo purposes, we'll store the HTML content as the certificate
    // In production, you'd want to convert this to PDF
    const certificateUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`

    // Save or update certificate record
    const { error: certError } = await supabaseClient
      .from('certificates')
      .upsert({
        id: existingCert?.id,
        user_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        verification_code: verificationCode,
        pdf_url: certificateUrl,
        issue_date: new Date().toISOString()
      })

    if (certError) {
      throw new Error(`Failed to save certificate record: ${certError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        certificateUrl,
        verificationCode,
        message: 'Certificate generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating certificate:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
