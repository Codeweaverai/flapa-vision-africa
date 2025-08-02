
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { OTPEmail } from "./_templates/otp-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateOTPRequest {
  verificationType: 'login' | 'registration' | 'inactive';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Invalid auth token");
    }

    const { verificationType }: GenerateOTPRequest = await req.json();

    // Rate limiting: Check for recent OTP requests (max 3 per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOTPs } = await supabase
      .from('user_otp_verifications')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', tenMinutesAgo);

    if (recentOTPs && recentOTPs.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('user_otp_verifications')
      .insert({
        user_id: user.id,
        otp_code: otpCode,
        verification_type: verificationType,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (otpError) {
      console.error('OTP storage error:', otpError);
      throw new Error('Failed to generate OTP');
    }

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(OTPEmail, {
        userFullName: profile?.full_name || 'User',
        otpCode,
        verificationType,
        expirationMinutes: 10
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "SkillPulse Security <security@skillpulse.app>",
      to: [user.email!],
      subject: `Your SkillPulse verification code: ${otpCode}`,
      html: emailHtml
    });

    console.log('OTP email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate OTP' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
