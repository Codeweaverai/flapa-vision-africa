
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface AnnouncementRequest {
  senderUserId: string;
  subject: string;
  message: string;
  studentUserIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      senderUserId, 
      subject, 
      message, 
      studentUserIds 
    }: AnnouncementRequest = await req.json();

    console.log('Processing student announcement for', studentUserIds.length, 'students');

    if (!senderUserId || !subject || !message || !studentUserIds.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sender profile
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', senderUserId)
      .single();

    if (senderError) {
      console.error('Error fetching sender profile:', senderError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sender profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const senderName = senderProfile.full_name || senderProfile.username || 'Course Instructor';

    // Get student emails
    const { data: userEmails, error: emailsError } = await supabase.rpc('get_user_emails', { 
      user_ids: studentUserIds 
    });

    if (emailsError) {
      console.error('Error fetching user emails:', emailsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch student emails' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get student profiles for display names
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', studentUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Process emails in batches to prevent rate limiting
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 1000; // 1 second delay between batches
    let emailSuccessCount = 0;

    for (let i = 0; i < studentUserIds.length; i += BATCH_SIZE) {
      const batch = studentUserIds.slice(i, i + BATCH_SIZE);
      
      const emailPromises = batch.map(async (userId) => {
        try {
          const userEmail = userEmails?.find(e => e.id === userId);
          const userProfile = profiles?.find(p => p.id === userId);
          const userName = userProfile?.full_name || userProfile?.username || 'Student';

          if (!userEmail?.email) {
            console.log('No email found for user', userId);
            return false;
          }

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #a855f7 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
                  Course Announcement
                </h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                  From your instructor
                </p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">
                  ${subject}
                </h2>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.7;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                <p style="margin: 0 0 5px 0;">
                  This message was sent by <strong>${senderName}</strong>
                </p>
                <p style="margin: 0;">
                  SkillPulse Course Management
                </p>
              </div>
              
              <div style="margin-top: 25px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 12px; color: #92400e;">
                  <strong>Note:</strong> This announcement has also been sent to your SkillPulse inbox. 
                  Log in to your account to view all course messages and updates.
                </p>
              </div>
            </body>
            </html>
          `;

          const { error: emailError } = await resend.emails.send({
            from: 'SkillPulse Courses <noreply@skillpulse.cloud>',
            to: [userEmail.email],
            subject: `[Course] ${subject}`,
            html: emailHtml,
            reply_to: 'noreply@skillpulse.cloud'
          });

          if (emailError) {
            console.error('Error sending email to', userEmail.email, ':', emailError);
            return false;
          } else {
            return true;
          }
        } catch (emailError) {
          console.error('Email sending error for user', userId, ':', emailError);
          return false;
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(emailPromises);
      emailSuccessCount += batchResults.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < studentUserIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    console.log(`Student announcement sent successfully. Email: ${emailSuccessCount}/${studentUserIds.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailsSent: emailSuccessCount,
        totalStudents: studentUserIds.length,
        message: 'Announcement sent to selected students'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-student-announcement function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
