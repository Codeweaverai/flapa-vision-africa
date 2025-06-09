
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  certificateId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificateId, userId }: CertificateRequest = await req.json();

    // Get certificate details
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select(`
        *,
        course_enrollments!inner(
          course:courses(title)
        )
      `)
      .eq('id', certificateId)
      .eq('user_id', userId)
      .single();

    if (certError || !certificate) {
      throw new Error('Certificate not found');
    }

    // Get user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      throw new Error('User not found');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error('Profile not found');
    }

    // Generate certificate HTML
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #f97316, #a855f7);
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
            text-align: center;
            max-width: 800px;
            position: relative;
            border: 10px solid #f97316;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #a855f7;
            border-radius: 10px;
          }
          .header {
            margin-bottom: 40px;
          }
          .title {
            font-size: 48px;
            color: #a855f7;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .subtitle {
            font-size: 24px;
            color: #666;
            margin-bottom: 40px;
          }
          .recipient {
            font-size: 36px;
            color: #f97316;
            margin: 30px 0;
            font-weight: bold;
          }
          .course-title {
            font-size: 28px;
            color: #333;
            margin: 20px 0;
            font-style: italic;
          }
          .completion-text {
            font-size: 18px;
            color: #666;
            margin: 30px 0;
            line-height: 1.6;
          }
          .verification {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
          }
          .verification-code {
            font-size: 16px;
            color: #888;
            font-family: monospace;
          }
          .date {
            font-size: 16px;
            color: #888;
            margin-top: 10px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
          }
          .signature {
            text-align: center;
            flex: 1;
          }
          .signature-line {
            border-top: 2px solid #333;
            width: 200px;
            margin: 0 auto 10px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f97316, #a855f7);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="logo">MP</div>
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is to certify that</div>
          </div>
          
          <div class="recipient">${profile.full_name || 'Student'}</div>
          
          <div class="completion-text">
            has successfully completed the course
          </div>
          
          <div class="course-title">${certificate.course_enrollments?.course?.title || 'Course'}</div>
          
          <div class="completion-text">
            and has demonstrated mastery of the subject matter through comprehensive assessment.
            This achievement represents dedication to continuous learning and professional development.
          </div>
          
          <div class="signatures">
            <div class="signature">
              <div class="signature-line"></div>
              <div>Instructor</div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div>Director</div>
            </div>
          </div>
          
          <div class="verification">
            <div class="verification-code">
              Verification Code: ${certificate.verification_code}
            </div>
            <div class="date">
              Issued on ${new Date(certificate.issue_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to PDF (using a simple HTML to PDF service or library)
    // For now, we'll store the HTML and return a URL to it
    const fileName = `certificate-${certificate.verification_code}.html`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, new Blob([certificateHTML], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Update certificate with file path
    const { error: updateError } = await supabase
      .from('certificates')
      .update({ pdf_url: filePath })
      .eq('id', certificateId);

    if (updateError) {
      throw updateError;
    }

    console.log("Certificate generated successfully:", uploadData);

    return new Response(JSON.stringify({ 
      success: true, 
      filePath: filePath,
      message: 'Certificate generated successfully' 
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
