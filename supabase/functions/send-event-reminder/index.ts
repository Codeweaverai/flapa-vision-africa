import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { EventReminderEmail } from './_templates/event-reminder.tsx';
import { EventLiveEmail } from './_templates/event-live.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventReminderRequest {
  eventId: string;
  userId: string;
  reminderType: 'day_before' | 'hour_before' | '30_minutes_before' | 'event_live';
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

    if (!preferences || !preferences.event_reminders) {
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

    // Get event details with creator info
    const { data: event } = await supabase
      .from('events')
      .select(`
        *,
        creator:creator_id (full_name)
      `)
      .eq('id', eventId)
      .single();

    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser.user?.email;

    if (!event || !user || !userEmail) {
      throw new Error('Failed to fetch event or user data');
    }

    const creator = Array.isArray(event.creator) ? event.creator[0] : event.creator;

    // Render email template based on reminder type
    const emailComponent = reminderType === 'event_live' 
      ? React.createElement(EventLiveEmail, {
          attendeeName: user.full_name || 'Guest',
          eventTitle: event.title,
          eventDate: event.start_time,
          eventTime: new Date(event.start_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: event.location || 'TBA',
          organizerName: creator?.full_name || 'Event Host',
          eventUrl: `https://skillpulse.cloud/events/${eventId}`,
          onlineMeetingLink: event.online_meeting_link
        })
      : React.createElement(EventReminderEmail, {
          attendeeName: user.full_name || 'Guest',
          eventTitle: event.title,
          eventDate: event.start_time,
          eventTime: new Date(event.start_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: event.location || 'TBA',
          organizerName: creator?.full_name || 'Event Host',
          eventUrl: `https://skillpulse.cloud/events/${eventId}`,
          reminderType
        });

    const html = await renderAsync(emailComponent);

    // Create inbox message with appropriate content based on reminder type
    const inboxSubject = reminderType === 'event_live'
      ? `🔴 LIVE NOW: ${event.title} Has Started!`
      : reminderType === 'day_before' 
      ? `📅 Reminder: ${event.title} is Tomorrow`
      : reminderType === 'hour_before'
      ? `⏰ Starting Soon: ${event.title} in 1 Hour`
      : `🚀 Final Call: ${event.title} Starts in 30 Minutes`;
    
    const inboxContent = reminderType === 'event_live'
      ? `🔴 LIVE NOW! Your event "${event.title}" has started. Join now!\n\n` +
        (event.online_meeting_link 
          ? `🎥 Join Online: ${event.online_meeting_link}\n\n`
          : `📍 Location: ${event.location || 'TBA'}\n\n`) +
        `⚡ Quick Tips:\n` +
        `• Have your ticket/QR code ready\n` +
        `• Check in at registration\n` +
        `• Network with attendees\n` +
        `• Share on social media!\n\n` +
        `Don't miss out - the event is happening now!`
      : reminderType === 'day_before'
      ? `Your event "${event.title}" is tomorrow! Get ready for an amazing experience.\n\n` +
        `📍 Location: ${event.location || 'TBA'}\n` +
        `⏰ Time: ${new Date(event.start_time).toLocaleString()}\n\n` +
        `See you there!`
      : reminderType === 'hour_before'
      ? `Your event "${event.title}" starts in 1 hour. Don't forget to join!\n\n` +
        `📍 Location: ${event.location || 'TBA'}\n` +
        `⏰ Time: ${new Date(event.start_time).toLocaleString()}\n\n` +
        `Get ready!`
      : `Your event "${event.title}" is starting in 30 minutes. Join now!\n\n` +
        `📍 Location: ${event.location || 'TBA'}\n` +
        `⏰ Time: ${new Date(event.start_time).toLocaleString()}\n\n` +
        `See you soon!`;
    
    await supabase
      .from('inbox_messages')
      .insert({
        sender_id: null,
        recipient_id: userId,
        subject: inboxSubject,
        content: inboxContent,
        message_type: 'system',
        related_id: eventId
      });

    // Send email if user has email notifications enabled
    if (preferences.email_notifications) {
      const emailSubject = reminderType === 'event_live'
        ? `🔴 LIVE NOW: ${event.title} Has Started!`
        : reminderType === 'day_before'
        ? `Tomorrow: ${event.title}`
        : reminderType === 'hour_before'
        ? `Starting in 1 Hour: ${event.title}`
        : `Starting in 30 Minutes: ${event.title}`;

      await resend.emails.send({
        from: 'SkillPulse Events <events@skillpulse.cloud>',
        to: [userEmail],
        subject: emailSubject,
        html
      });

      console.log(`Email reminder sent to ${userEmail} for ${reminderType}`);
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
