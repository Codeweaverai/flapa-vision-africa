
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication - require admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create client with user's token to verify their identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { newsletterId } = await req.json();

    if (!newsletterId) {
      return new Response(JSON.stringify({ error: 'Newsletter ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch the newsletter
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      return new Response(JSON.stringify({ error: 'Newsletter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Update newsletter status to sending
    await supabaseAdmin
      .from('newsletters')
      .update({ status: 'sending' })
      .eq('id', newsletterId);

    // Fetch all users (both verified and unverified)
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    const allUsers = authUsers?.users || [];

    // Fetch dynamic content
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('is_published', true);

    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .gte('start_time', new Date().toISOString());

    // Create logs
    const logs = allUsers.map((user: any) => ({
      newsletter_id: newsletterId,
      user_id: user.id,
      email: user.email,
      status: 'pending'
    }));

    await supabaseAdmin.from('newsletter_logs').insert(logs);

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send emails
    let successCount = 0;
    let failureCount = 0;

    for (const user of allUsers) {
      try {
        const fullName = user.raw_user_meta_data?.full_name || 
                        user.raw_user_meta_data?.display_name || 
                        user.raw_user_meta_data?.username || 
                        'Valued User';
        
        const coursesList = courses?.map((c: any) => c.title).join(', ') || 'Check out our latest courses';
        const eventsList = events?.map((e: any) => e.title).join(', ') || 'Explore upcoming events';
        
        let personalizedContent = newsletter.body_html
          .replace(/\{\{full_name\}\}/g, fullName)
          .replace(/\{\{display_name\}\}/g, fullName)
          .replace(/\{\{course_names\}\}/g, coursesList)
          .replace(/\{\{event_titles\}\}/g, eventsList);

        let personalizedSubject = newsletter.subject
          .replace(/\{\{full_name\}\}/g, fullName)
          .replace(/\{\{display_name\}\}/g, fullName);

        // Generate secure unsubscribe token using HMAC
        const encoder = new TextEncoder();
        const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(secretKey),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const timestamp = Date.now();
        const data = encoder.encode(`${user.id}:${timestamp}`);
        const signature = await crypto.subtle.sign('HMAC', key, data);
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const token = btoa(`${user.id}:${timestamp}:${signatureHex}`);

        const unsubscribeUrl = `https://skillpulse.cloud/unsubscribe?token=${encodeURIComponent(token)}`;
        
        const emailBody = personalizedContent + `
          <br><br>
          <div style="text-align: center; font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>You're receiving this because you're subscribed to our newsletter.</p>
            <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a></p>
          </div>
        `;

        await resend.emails.send({
          from: 'Newsletter <no-reply@skillpulse.cloud>',
          to: [user.email],
          subject: personalizedSubject,
          html: emailBody,
        });

        await supabaseAdmin
          .from('newsletter_logs')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('newsletter_id', newsletterId)
          .eq('user_id', user.id);

        successCount++;
      } catch (error) {
        await supabaseAdmin
          .from('newsletter_logs')
          .update({ status: 'failed', error_message: error.message })
          .eq('newsletter_id', newsletterId)
          .eq('user_id', user.id);

        failureCount++;
      }
    }

    // Update newsletter
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: allUsers.length,
        successful_sends: successCount,
        failed_sends: failureCount
      })
      .eq('id', newsletterId);

    return new Response(JSON.stringify({
      success: true,
      total_recipients: allUsers.length,
      successful_sends: successCount,
      failed_sends: failureCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Send newsletter error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
