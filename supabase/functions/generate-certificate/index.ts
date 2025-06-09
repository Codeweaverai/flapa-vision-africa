
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificateId, userId } = await req.json();

    console.log('Processing certificate generation for:', { certificateId, userId });

    // Get certificate details
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select(`
        *,
        course_enrollments!inner(
          user_id,
          course:courses(title),
          final_exam_results(final_grade, completed_at)
        )
      `)
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      console.error('Certificate not found:', certError);
      throw new Error('Certificate not found');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single();

    const studentName = profile?.full_name || profile?.username || 'Student';
    const courseName = certificate.course_enrollments.course.title;
    const completionDate = new Date(certificate.issue_date).toLocaleDateString();
    const grade = certificate.course_enrollments.final_exam_results?.[0]?.final_grade || 'Pass';

    // Generate HTML certificate
    const certificateHTML = createCertificateHTML(studentName, courseName, completionDate, grade, certificate.verification_code);

    // Generate PDF using jsPDF (client-side approach)
    const pdfDataUrl = await generatePDFFromHTML(certificateHTML);

    // Update certificate record with PDF URL
    const { error: updateError } = await supabase
      .from('certificates')
      .update({ 
        pdf_url: pdfDataUrl,
        user_id: userId,
        course_id: certificate.course_enrollments.course_id
      })
      .eq('id', certificateId);

    if (updateError) {
      console.error('Failed to update certificate record:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      certificateUrl: pdfDataUrl,
      verificationCode: certificate.verification_code
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function generatePDFFromHTML(html: string): Promise<string> {
  // For now, return HTML data URL since we can't use Puppeteer in Deno Deploy
  // In production, you'd want to use a PDF service like PDFShift, HTMLtoPDF, etc.
  const htmlDataUrl = `data:text/html;base64,${btoa(html)}`;
  return htmlDataUrl;
}

function createCertificateHTML(studentName: string, courseName: string, completionDate: string, grade: string, verificationCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>SkillPulse Certificate</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        
        body {
          font-family: 'Georgia', serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%);
          width: 100vw;
          height: 100vh;
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
          width: 90%;
          text-align: center;
          border: 8px solid #f59e0b;
          position: relative;
          min-height: 500px;
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
        }
        
        .signature-line {
          border-top: 2px solid #1f2937;
          width: 200px;
          text-align: center;
          padding-top: 10px;
          font-size: 0.9rem;
          color: #6b7280;
        }
        
        .verification {
          margin-top: 30px;
          font-size: 0.8rem;
          color: #9ca3af;
        }
        
        .ornament {
          position: absolute;
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #f59e0b, #8b5cf6);
          border-radius: 50%;
        }
        
        .ornament.top-left { top: 40px; left: 40px; }
        .ornament.top-right { top: 40px; right: 40px; }
        .ornament.bottom-left { bottom: 40px; left: 40px; }
        .ornament.bottom-right { bottom: 40px; right: 40px; }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="ornament top-left"></div>
        <div class="ornament top-right"></div>
        <div class="ornament bottom-left"></div>
        <div class="ornament bottom-right"></div>
        
        <div class="logo">🎓 SkillPulse</div>
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">This is to certify that</div>
        <div class="recipient">${studentName}</div>
        <div class="completion">has successfully completed the course</div>
        <div class="course">"${courseName}"</div>
        <div class="grade-badge">Final Grade: ${grade}%</div>
        <div class="completion">demonstrating professional competency and commitment to continuous learning</div>
        <div class="signature">
          <div class="signature-line">
            <strong>SkillPulse Academy</strong><br>
            Authorized Signature
          </div>
          <div style="text-align: center;">
            <div style="font-size: 0.9rem; color: #6b7280;">${completionDate}</div>
            <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">Date of Completion</div>
          </div>
        </div>
        <div class="verification">
          Verification Code: ${verificationCode}<br>
          This certificate can be verified at skillpulse.com/verify
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
