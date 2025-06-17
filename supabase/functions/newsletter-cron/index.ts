
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface Newsletter {
  id: string;
  subject: string;
  body_html: string;
  scheduled_at: string;
  status: string;
  created_by: string;
}

interface User {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name?: string;
    display_name?: string;
    username?: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface Event {
  id: string;
  title: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Newsletter cron job started...');

    // Fetch newsletters that are scheduled and ready to send
    const { data: newsletters, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (newsletterError) {
      console.error('Error fetching newsletters:', newsletterError);
      throw newsletterError;
    }

    if (!newsletters || newsletters.length === 0) {
      console.log('No newsletters to send');
      return new Response(JSON.stringify({ message: 'No newsletters to send' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`Found ${newsletters.length} newsletters to send`);

    // Process each newsletter
    for (const newsletter of newsletters as Newsletter[]) {
      console.log(`Processing newsletter: ${newsletter.subject}`);
      
      // Mark newsletter as sending
      await supabase
        .from('newsletters')
        .update({ status: 'sending' })
        .eq('id', newsletter.id);

      try {
        // Fetch all users from auth.users (includes all users - verified and unverified)
        const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw usersError;
        }

        if (!authUsers?.users || authUsers.users.length === 0) {
          console.log('No users found');
          await supabase
            .from('newsletters')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', newsletter.id);
          continue;
        }

        // Send to ALL users (both verified and unverified)
        const allUsers = authUsers.users;
        console.log(`Sending to ${allUsers.length} total users`);

        // Fetch courses and events for dynamic placeholders
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title')
          .eq('is_published', true);

        const { data: events } = await supabase
          .from('events')
          .select('id, title')
          .gte('start_time', new Date().toISOString());

        // Create newsletter logs for all recipients
        const logs = allUsers.map((user: any) => ({
          newsletter_id: newsletter.id,
          user_id: user.id,
          email: user.email,
          status: 'pending'
        }));

        await supabase
          .from('newsletter_logs')
          .insert(logs);

        // Send emails in batches to avoid rate limits
        const batchSize = 10;
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < allUsers.length; i += batchSize) {
          const batch = allUsers.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (user: any) => {
            try {
              // Replace dynamic placeholders
              const fullName = user.raw_user_meta_data?.full_name || 
                             user.raw_user_meta_data?.display_name || 
                             user.raw_user_meta_data?.username || 
                             'Valued User';
              
              const coursesList = courses?.map((c: Course) => c.title).join(', ') || 'Check out our latest courses';
              const eventsList = events?.map((e: Event) => e.title).join(', ') || 'Explore upcoming events';
              
              let personalizedContent = newsletter.body_html
                .replace(/\{\{full_name\}\}/g, fullName)
                .replace(/\{\{display_name\}\}/g, fullName)
                .replace(/\{\{course_names\}\}/g, coursesList)
                .replace(/\{\{event_titles\}\}/g, eventsList);

              let personalizedSubject = newsletter.subject
                .replace(/\{\{full_name\}\}/g, fullName)
                .replace(/\{\{display_name\}\}/g, fullName);

              // Create unsubscribe link with skillpulse.cloud domain
              const unsubscribeUrl = `https://skillpulse.cloud/unsubscribe?token=${btoa(user.id)}`;
              
              // Add unsubscribe link to HTML body
              const emailBody = personalizedContent + `
                <br><br>
                <div style="text-align: center; font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p>You're receiving this because you're subscribed to our newsletter.</p>
                  <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a></p>
                </div>
              `;

              const emailResponse = await resend.emails.send({
                from: 'Newsletter <no-reply@skillpulse.cloud>',
                to: [user.email],
                subject: personalizedSubject,
                html: emailBody,
                headers: {
                  'X-Newsletter-ID': newsletter.id,
                  'X-User-ID': user.id
                }
              });

              console.log(`Email sent to ${user.email}:`, emailResponse);

              // Update log as sent
              await supabase
                .from('newsletter_logs')
                .update({ 
                  status: 'sent', 
                  sent_at: new Date().toISOString() 
                })
                .eq('newsletter_id', newsletter.id)
                .eq('user_id', user.id);

              successCount++;

            } catch (emailError) {
              console.error(`Failed to send email to ${user.email}:`, emailError);
              
              // Update log as failed
              await supabase
                .from('newsletter_logs')
                .update({ 
                  status: 'failed',
                  error_message: emailError.message || 'Unknown error'
                })
                .eq('newsletter_id', newsletter.id)
                .eq('user_id', user.id);

              failureCount++;
            }
          }));

          // Small delay between batches
          if (i + batchSize < allUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Update newsletter status and statistics
        await supabase
          .from('newsletters')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            total_recipients: allUsers.length,
            successful_sends: successCount,
            failed_sends: failureCount
          })
          .eq('id', newsletter.id);

        console.log(`Newsletter ${newsletter.subject} sent: ${successCount} success, ${failureCount} failed`);

      } catch (error) {
        console.error(`Error processing newsletter ${newsletter.id}:`, error);
        
        // Mark newsletter as failed
        await supabase
          .from('newsletters')
          .update({ status: 'failed' })
          .eq('id', newsletter.id);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${newsletters.length} newsletters` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Newsletter cron job error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
