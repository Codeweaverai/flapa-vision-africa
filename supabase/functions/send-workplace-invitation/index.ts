
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  workplace_id: string;
  invited_email: string;
  role: string;
  invitation_token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { workplace_id, invited_email, role, invitation_token }: InvitationRequest = await req.json();

    // Get workplace details
    const { data: workplace, error: workplaceError } = await supabase
      .from('creator_workplaces')
      .select('name, owner_id')
      .eq('id', workplace_id)
      .single();

    if (workplaceError || !workplace) {
      throw new Error('Workplace not found');
    }

    // Get inviter details
    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', workplace.owner_id)
      .single();

    if (inviterError || !inviter) {
      throw new Error('Inviter not found');
    }

    // Create invitation link
    const inviteUrl = `${req.headers.get('origin')}/accept-invite?token=${invitation_token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "SkillPulse <noreply@skillpulse.cloud>",
      to: [invited_email],
      subject: `Invitation to join ${workplace.name} workspace`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">You're invited to join a workspace!</h1>
          <p>Hello,</p>
          <p><strong>${inviter.full_name || inviter.username}</strong> has invited you to join the <strong>${workplace.name}</strong> workspace on SkillPulse as a <strong>${role}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days. If you don't want to join this workspace, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link: ${inviteUrl}</p>
        </div>
      `,
    });

    console.log("Workplace invitation email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending workplace invitation:", error);
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
