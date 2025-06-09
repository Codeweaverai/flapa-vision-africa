
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { launch } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
          
          body {
            margin: 0;
            padding: 40px;
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .certificate {
            width: 800px;
            height: 600px;
            background: white;
            border: 20px solid #2c3e50;
            border-image: linear-gradient(45deg, #3498db, #e74c3c, #f39c12, #27ae60) 1;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 15px;
            left: 15px;
            right: 15px;
            bottom: 15px;
            border: 3px solid #34495e;
          }
          
          .header {
            text-align: center;
            padding: 40px 0 20px 0;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-weight: 700;
            color: #2c3e50;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }
          
          .subtitle {
            font-size: 18px;
            color: #7f8c8d;
            margin: 10px 0;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          
          .content {
            text-align: center;
            padding: 20px 60px;
          }
          
          .presented-to {
            font-size: 16px;
            color: #34495e;
            margin-bottom: 10px;
          }
          
          .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #e74c3c;
            margin: 10px 0 20px 0;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 10px;
            display: inline-block;
          }
          
          .course-info {
            font-size: 18px;
            color: #2c3e50;
            margin: 20px 0;
            line-height: 1.6;
          }
          
          .course-name {
            font-weight: 600;
            color: #3498db;
          }
          
          .grade {
            font-size: 20px;
            font-weight: 600;
            color: #27ae60;
            margin: 15px 0;
          }
          
          .footer {
            position: absolute;
            bottom: 40px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 80px;
            align-items: end;
          }
          
          .date-section {
            text-align: left;
          }
          
          .signature-section {
            text-align: right;
          }
          
          .date, .signature-label {
            font-size: 14px;
            color: #7f8c8d;
            margin-bottom: 5px;
          }
          
          .date-value {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 2px solid #bdc3c7;
            padding-bottom: 5px;
            min-width: 150px;
            display: inline-block;
          }
          
          .signature-image {
            width: 150px;
            height: 60px;
            object-fit: contain;
            margin-bottom: 5px;
          }
          
          .director-label {
            font-size: 14px;
            color: #2c3e50;
            font-weight: 600;
            border-top: 2px solid #bdc3c7;
            padding-top: 5px;
            min-width: 150px;
          }
          
          .verification {
            position: absolute;
            bottom: 10px;
            right: 20px;
            font-size: 10px;
            color: #95a5a6;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <h1 class="title">Certificate of Completion</h1>
            <p class="subtitle">SkillPulse Academy</p>
          </div>
          
          <div class="content">
            <p class="presented-to">This is to certify that</p>
            <h2 class="student-name">${studentName}</h2>
            
            <div class="course-info">
              has successfully completed the course<br>
              <span class="course-name">"${courseName}"</span><br>
              and demonstrated proficiency in the subject matter.
            </div>
            
            <div class="grade">Final Grade: ${grade}%</div>
          </div>
          
          <div class="footer">
            <div class="date-section">
              <div class="date">Date of Completion</div>
              <div class="date-value">${completionDate}</div>
            </div>
            
            <div class="signature-section">
              <img src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/signature.png" 
                   alt="Director Signature" class="signature-image" />
              <div class="director-label">Director, SkillPulse Academy<br>Authorized Signature</div>
            </div>
          </div>
          
          <div class="verification">
            Verification Code: ${certificate.verification_code}
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(certificateHTML);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
    });
    
    await browser.close();

    // Upload to Supabase Storage
    const fileName = `${userId}_${certificate.course_enrollments.course_id || 'course'}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload certificate: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    // Update certificate record with PDF URL
    const { error: updateError } = await supabase
      .from('certificates')
      .update({ 
        pdf_url: urlData.publicUrl,
        user_id: userId,
        course_id: certificate.course_enrollments.course_id
      })
      .eq('id', certificateId);

    if (updateError) {
      console.error('Failed to update certificate record:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      certificateUrl: urlData.publicUrl,
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

serve(handler);
