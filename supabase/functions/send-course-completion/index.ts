
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { CourseCompletionEmail } from './_templates/course-completion.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received course completion webhook payload:", JSON.stringify(payload));

    // Handle webhook payload structure
    const record = payload.record || payload;
    const oldRecord = payload.old_record;

    // Only process if is_completed changed from false to true
    if (oldRecord && !oldRecord.is_completed && record.is_completed) {
      console.log("Course completed! Processing email...");
    } else if (!record.is_completed) {
      console.log("Course not completed yet, skipping email");
      return new Response(JSON.stringify({ message: "Course not completed, skipping" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(record.user_id);
    if (userError) {
      console.error("Error fetching user:", userError);
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    // Fetch user profile for name
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.user_id)
      .single();

    // Fetch course details
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("title, creator_id")
      .eq("id", record.course_id)
      .single();

    if (courseError) {
      console.error("Error fetching course:", courseError);
      throw new Error(`Failed to fetch course: ${courseError.message}`);
    }

    // Fetch instructor name
    let instructorName = "SkillPulse Instructor";
    if (courseData.creator_id) {
      const { data: instructorData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", courseData.creator_id)
        .single();
      
      if (instructorData?.full_name) {
        instructorName = instructorData.full_name;
      }
    }

    // Check for certificate
    const { data: certificateData } = await supabase
      .from("certificates")
      .select("verification_code")
      .eq("enrollment_id", record.id)
      .single();

    const certificateUrl = certificateData 
      ? `https://skillpulse.cloud/certificate/${certificateData.verification_code}`
      : undefined;

    const studentEmail = userData.user.email;
    const studentName = profileData?.full_name || userData.user.user_metadata?.full_name || "Student";

    console.log(`Sending completion email to: ${studentEmail} for course: ${courseData.title}`);

    const html = await renderAsync(
      React.createElement(CourseCompletionEmail, {
        studentName,
        courseTitle: courseData.title,
        courseId: record.course_id,
        completionDate: record.completion_date || new Date().toISOString(),
        certificateUrl,
        instructorName
      })
    );

    const emailResponse = await resend.emails.send({
      from: "SkillPulse <noreply@skillpulse.cloud>",
      to: [studentEmail],
      subject: `🎉 Congratulations! You've completed "${courseData.title}"`,
      html,
    });

    console.log("Course completion email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-course-completion function:", error);
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
