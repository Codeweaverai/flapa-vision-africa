
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { CourseEnrollmentEmail } from './_templates/course-enrollment.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentRequest {
  email: string;
  studentName: string;
  courseTitle: string;
  courseId: string;
  instructorName: string;
  enrollmentDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, studentName, courseTitle, courseId, instructorName, enrollmentDate }: EnrollmentRequest = await req.json();

    const html = await renderAsync(
      React.createElement(CourseEnrollmentEmail, {
        studentName,
        courseTitle,
        courseId,
        instructorName,
        enrollmentDate
      })
    );

    const emailResponse = await resend.emails.send({
      from: "SkillPulse <courses@skillpulse.cloud>",
      to: [email],
      subject: `Welcome to "${courseTitle}" - Let's Start Learning! 📚`,
      html,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-course-enrollment function:", error);
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
