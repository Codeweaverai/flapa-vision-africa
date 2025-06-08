
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExamNotificationRequest {
  userId: string;
  courseTitle: string;
  finalGrade: number;
  passed: boolean;
  examScore: number;
  studentName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, courseTitle, finalGrade, passed, examScore, studentName }: ExamNotificationRequest = await req.json();

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
      throw new Error('User not found or email not available');
    }

    const userEmail = userData.user.email;
    const status = passed ? 'PASSED' : 'FAILED';
    const statusColor = passed ? '#22c55e' : '#ef4444';

    const emailResponse = await resend.emails.send({
      from: "Learning Platform <noreply@yourdomain.com>",
      to: [userEmail],
      subject: `Course ${status}: ${courseTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #f97316, #a855f7); padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 2rem;">Course Completion Results</h1>
          </div>
          
          <div style="padding: 2rem; background: white; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${studentName}!</h2>
            
            <p>You have completed the final exam for <strong>${courseTitle}</strong>.</p>
            
            <div style="background: ${passed ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${statusColor}; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; text-align: center;">
              <h3 style="color: ${statusColor}; margin: 0 0 1rem 0; font-size: 1.5rem;">
                ${status}
              </h3>
              <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <div style="font-size: 2rem; font-weight: bold; color: ${statusColor};">${examScore}%</div>
                  <div style="color: #6b7280;">Exam Score</div>
                </div>
                <div>
                  <div style="font-size: 2rem; font-weight: bold; color: ${statusColor};">${finalGrade}%</div>
                  <div style="color: #6b7280;">Final Grade</div>
                </div>
              </div>
            </div>
            
            ${passed ? `
              <p style="color: #059669;">🎉 <strong>Congratulations!</strong> You have successfully completed the course and are eligible for a certificate.</p>
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${Deno.env.get('SITE_URL')}/learning/course-results" 
                   style="background: linear-gradient(135deg, #f97316, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Your Results & Certificate
                </a>
              </div>
            ` : `
              <p style="color: #dc2626;">Unfortunately, you did not meet the passing requirements for this course. Don't worry - you can retake the exam to improve your score!</p>
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${Deno.env.get('SITE_URL')}/learning/course/${courseTitle.replace(/\s+/g, '-').toLowerCase()}" 
                   style="background: linear-gradient(135deg, #f97316, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Retake Exam
                </a>
              </div>
            `}
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
            
            <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
              This is an automated message from the Learning Platform. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Exam notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending exam notification:", error);
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
