
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  otpCode: string;
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

    const { otpCode }: VerifyOTPRequest = await req.json();

    if (!otpCode || otpCode.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the most recent valid OTP for this user
    const { data: otpRecord, error: otpError } = await supabase
      .from('user_otp_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('otp_code', otpCode)
      .is('verified_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('OTP lookup error:', otpError);
      throw new Error('Failed to verify OTP');
    }

    if (!otpRecord) {
      // Increment attempts for any unverified OTP for this user
      await supabase
        .from('user_otp_verifications')
        .update({ attempts: supabase.rpc('increment_attempts') })
        .eq('user_id', user.id)
        .is('verified_at', null);

      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check attempt limits
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('user_otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('OTP verification update error:', updateError);
      throw new Error('Failed to mark OTP as verified');
    }

    // Update user profile to mark as OTP verified and update last activity
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        otp_verified: true,
        otp_required: false,
        last_activity: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail the verification if profile update fails
    }

    // Clean up old/expired OTPs for this user
    await supabase
      .from('user_otp_verifications')
      .delete()
      .eq('user_id', user.id)
      .or('verified_at.not.is.null,expires_at.lt.' + new Date().toISOString());

    console.log('OTP verified successfully for user:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP verified successfully' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to verify OTP' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
