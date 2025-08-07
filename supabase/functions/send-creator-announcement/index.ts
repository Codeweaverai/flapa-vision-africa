
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreatorAnnouncementRequest {
  creatorId: string;
  subject: string;
  message: string;
  recipientUserIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { creatorId, subject, message, recipientUserIds }: CreatorAnnouncementRequest = await req.json();

    if (!creatorId || !subject || !message || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creator announcement request: ${creatorId} sending to ${recipientUserIds.length} recipients`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get creator profile
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', creatorId)
      .single();

    if (creatorError) {
      console.error('Error fetching creator profile:', creatorError);
      throw new Error('Failed to fetch creator profile');
    }

    const creatorName = creatorProfile?.full_name || 'Your Instructor';

    // Get user emails using the RPC function
    const { data: userEmails, error: emailError } = await supabase
      .rpc('get_user_emails', { user_ids: recipientUserIds });

    if (emailError) {
      console.error('Error fetching user emails:', emailError);
      throw new Error('Failed to fetch recipient emails');
    }

    // Get user profiles for names
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', recipientUserIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw new Error('Failed to fetch user profiles');
    }

    // Create a map for quick lookup
    const emailMap = new Map(userEmails?.map(u => [u.id, u.email]) || []);
    const nameMap = new Map(userProfiles?.map(p => [p.id, p.full_name]) || []);

    let successCount = 0;
    let failureCount = 0;

    // Initialize Resend if we have an API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let resend: any = null;
    
    if (resendApiKey) {
      resend = new Resend(resendApiKey);
    }

    // Process each recipient
    for (const userId of recipientUserIds) {
      try {
        const userEmail = emailMap.get(userId);
        const userName = nameMap.get(userId) || 'Student';

        // Send inbox message
        const { error: inboxError } = await supabase
          .from('inbox_messages')
          .insert({
            sender_id: null, // System message
            recipient_id: userId,
            subject: `[ANNOUNCEMENT] ${subject}`,
            content: message,
            message_type: 'announcement'
          });

        if (inboxError) {
          console.error(`Error sending inbox message to ${userId}:`, inboxError);
          failureCount++;
          continue;
        }

        // Send email if Resend is configured and we have the user's email
        if (resend && userEmail) {
          try {
            await resend.emails.send({
              from: 'Lovable <onboarding@resend.dev>',
              to: [userEmail],
              subject: `Announcement from ${creatorName}: ${subject}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
                    Message from ${creatorName}
                  </h2>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">${subject}</h3>
                    <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                  </div>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px;">
                    <p>This message was sent to you as a student/attendee of ${creatorName}'s content.</p>
                    <p>You can also view this message in your account inbox.</p>
                  </div>
                </div>
              `
            });
            console.log(`Email sent successfully to ${userEmail}`);
          } catch (emailError) {
            console.error(`Error sending email to ${userEmail}:`, emailError);
            // Don't fail the whole operation if email fails
          }
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing recipient ${userId}:`, error);
        failureCount++;
      }
    }

    console.log(`Announcement completed: ${successCount} success, ${failureCount} failures`);

    return new Response(JSON.stringify({
      success: true,
      message: `Announcement sent successfully`,
      details: {
        totalRecipients: recipientUserIds.length,
        successCount,
        failureCount
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-creator-announcement function:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send announcement',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
