
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { workplaceId, email, token: inviteToken, role } = await req.json()

    // Get workplace details
    const { data: workplace, error: workplaceError } = await supabaseClient
      .from('creator_workplaces')
      .select('name, owner_id')
      .eq('id', workplaceId)
      .single()

    if (workplaceError || !workplace) {
      throw new Error('Workplace not found')
    }

    // Get inviter details
    const { data: inviter, error: inviterError } = await supabaseClient
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    if (inviterError) {
      console.error('Error fetching inviter profile:', inviterError)
    }

    const inviterName = inviter?.full_name || inviter?.username || user.email

    // Create invitation URL
    const inviteUrl = `${Deno.env.get('SITE_URL') || 'https://skillpulse.com'}/accept-invite?token=${inviteToken}`

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SkillPulse <noreply@skillpulse.com>',
        to: [email],
        subject: `You're invited to collaborate on ${workplace.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Workplace Invitation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6, #f97316); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              .role-badge { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #374151; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 You're Invited to Collaborate!</h1>
              </div>
              <div class="content">
                <h2>Hello!</h2>
                <p><strong>${inviterName}</strong> has invited you to join the <strong>${workplace.name}</strong> workplace on SkillPulse.</p>
                
                <p>You've been invited as a <span class="role-badge">${role.toUpperCase()}</span> which means you can:</p>
                
                ${role === 'editor' ? `
                  <ul>
                    <li>✏️ Create and edit courses</li>
                    <li>📅 Manage events</li>
                    <li>👥 View attendee information</li>
                    <li>📊 Access analytics</li>
                  </ul>
                ` : `
                  <ul>
                    <li>👀 View courses and events</li>
                    <li>📊 Access analytics</li>
                    <li>👥 View attendee information</li>
                  </ul>
                `}
                
                <p style="text-align: center;">
                  <a href="${inviteUrl}" class="button" style="color: white;">Accept Invitation</a>
                </p>
                
                <p><small>This invitation will expire in 7 days. If the button doesn't work, copy and paste this link into your browser: <br><code>${inviteUrl}</code></small></p>
              </div>
              <div class="footer">
                <p>Best regards,<br>The SkillPulse Team</p>
                <p><small>If you didn't expect this invitation, you can safely ignore this email.</small></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
You've been invited to collaborate!

${inviterName} has invited you to join the ${workplace.name} workplace on SkillPulse as a ${role}.

Click here to accept: ${inviteUrl}

This invitation expires in 7 days.

Best regards,
The SkillPulse Team
        `
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      throw new Error(`Failed to send email: ${errorData}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error sending workplace invitation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
