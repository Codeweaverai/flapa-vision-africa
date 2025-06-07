
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ContactSubmissionEmail } from './_templates/contact-submission.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface ContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Contact form request received:', req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Check if RESEND_API_KEY is available
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { firstName, lastName, email, subject, message }: ContactRequest = await req.json();
    console.log('Contact form data received:', { firstName, lastName, email, subject });

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store contact submission in database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        subject: subject,
        message: message
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store contact submission' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Contact submission stored successfully:', submission.id);

    // Render email template
    const html = await renderAsync(
      React.createElement(ContactSubmissionEmail, {
        firstName,
        lastName,
        email,
        subject,
        message,
        submissionId: submission.id
      })
    );

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: "SkillPulse Contact <no-reply@skillpulse.cloud>",
      to: ["flapabaytravelplus@gmail.com"],
      subject: `New Contact Form Submission: ${subject}`,
      html,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      submissionId: submission.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
