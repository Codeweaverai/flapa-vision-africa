import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventReminderRequest {
  eventId: string;
  userId: string;
  reminderType: '24h' | '2h' | '15min';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { eventId, userId, reminderType }: EventReminderRequest = await req.json();

    console.log(`Processing event reminder: ${reminderType} for user ${userId}, event ${eventId}`);

    // Check if reminder already sent
    const { data: existingReminder } = await supabase
      .from('event_reminder_logs')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('reminder_type', reminderType)
      .single();

    if (existingReminder) {
      console.log('Reminder already sent, skipping');
      return new Response(JSON.stringify({ message: 'Reminder already sent' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!preferences?.event_reminders_enabled) {
      await supabase.from('event_reminder_logs').insert({
        event_id: eventId,
        user_id: userId,
        reminder_type: reminderType,
        status: 'skipped',
        error_message: 'User has disabled event reminders'
      });

      return new Response(JSON.stringify({ message: 'User has disabled reminders' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get event and user details
    const { data: eventData } = await supabase
      .from('events')
      .select(`
        *,
        profiles:creator_id (full_name, email)
      `)
      .eq('id', eventId)
      .single();

    const { data: userData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    const { data: userEmail } = await supabase.auth.admin.getUserById(userId);

    if (!eventData || !userData || !userEmail.user?.email) {
      throw new Error('Failed to fetch event or user data');
    }

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: userId,
      content: `Event reminder: "${eventData.title}" starts ${reminderType === '24h' ? 'tomorrow' : reminderType === '2h' ? 'in 2 hours' : 'in 15 minutes'}`,
      type: 'event_reminder',
      related_id: eventId
    });

    // Create inbox message
    await supabase.from('inbox_messages').insert({
      recipient_id: userId,
      subject: `Event Reminder: ${eventData.title}`,
      content: `This is a friendly reminder that your event "${eventData.title}" is coming up ${reminderType === '24h' ? 'tomorrow' : reminderType === '2h' ? 'in 2 hours' : 'in 15 minutes'}.\n\nEvent Details:\n- Date: ${new Date(eventData.start_time).toLocaleDateString()}\n- Time: ${new Date(eventData.start_time).toLocaleTimeString()}\n- Location: ${eventData.location || 'Online'}\n\nWe look forward to seeing you there!`,
      message_type: 'event_reminder',
      related_id: eventId
    });

    // Send email if enabled
    if (preferences.email_notifications_enabled && userEmail.user.email) {
      const reminderText = reminderType === '24h' ? '24 hours' : reminderType === '2h' ? '2 hours' : '15 minutes';
      
      await resend.emails.send({
        from: 'Events <events@resend.dev>',
        to: [userEmail.user.email],
        subject: `Event Reminder: ${eventData.title} in ${reminderText}`,
        html: `
          <h2>Event Reminder</h2>
          <p>Hi ${userData.full_name},</p>
          <p>This is a friendly reminder that your event is coming up in ${reminderText}!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${eventData.title}</h3>
            <p><strong>Date:</strong> ${new Date(eventData.start_time).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(eventData.start_time).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${eventData.location || 'Online'}</p>
          </div>
          
          <p>We look forward to seeing you there!</p>
          <p>Best regards,<br>The Events Team</p>
        `
      });
    }

    // Log the reminder
    await supabase.from('event_reminder_logs').insert({
      event_id: eventId,
      user_id: userId,
      reminder_type: reminderType,
      status: 'sent'
    });

    console.log(`Event reminder sent successfully: ${reminderType} for user ${userId}`);

    return new Response(JSON.stringify({ 
      message: 'Event reminder sent successfully',
      reminderType,
      eventId,
      userId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error sending event reminder:', error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const body = await req.json();
      await supabase.from('event_reminder_logs').insert({
        event_id: body.eventId,
        user_id: body.userId,
        reminder_type: body.reminderType,
        status: 'failed',
        error_message: error.message
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);