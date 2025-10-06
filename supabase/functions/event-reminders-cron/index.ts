import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting event reminders cron job...');

    // Find events happening in the next 24 hours, 2 hours, 15 minutes, and events that just started
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // For events that started in last 5 min

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        start_time,
        location,
        online_meeting_link,
        event_bookings!inner(
          id,
          user_id,
          status,
          profiles!inner(
            id,
            notification_preferences(*)
          )
        )
      `)
      .eq('event_bookings.status', 'confirmed')
      .or(`and(start_time.gte.${now.toISOString()},start_time.lte.${twentyFourHoursFromNow.toISOString()}),and(start_time.gte.${fiveMinutesAgo.toISOString()},start_time.lte.${now.toISOString()})`);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    console.log(`Found ${upcomingEvents?.length || 0} upcoming events with bookings`);

    let remindersSent = 0;
    let remindersSkipped = 0;
    let remindersFailed = 0;

    const remindersToSend: Array<{
      eventId: string;
      userId: string;
      reminderType: 'day_before' | 'hour_before' | '30_minutes_before' | 'event_live';
    }> = [];

    for (const event of upcomingEvents || []) {
      for (const booking of event.event_bookings) {
        const preferences = booking.profiles?.notification_preferences?.[0];
        
        if (!preferences || !preferences.event_reminders) {
          remindersSkipped++;
          continue;
        }

        let shouldSend24h = false;
        let shouldSend2h = false;
        let shouldSend15min = false;
        let shouldSendLive = false;

        // Determine which reminders to send based on event time
        const eventTime = new Date(event.start_time);
        const timeDiff = eventTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        const minutesDiff = timeDiff / (1000 * 60);
        
        // Send live event notification (event started in last 5 minutes)
        if (timeDiff <= 0 && timeDiff > -5 * 60 * 1000) {
          shouldSendLive = true;
        }
        
        // Send 24 hour reminder
        if (hoursDiff <= 24 && hoursDiff > 23 && preferences.reminder_24h) {
          shouldSend24h = true;
        }
        
        // Send 2 hour reminder  
        if (hoursDiff <= 2 && hoursDiff > 1.75 && preferences.reminder_2h) {
          shouldSend2h = true;
        }
        
        // Send 15 minute reminder
        if (minutesDiff <= 15 && minutesDiff > 10 && preferences.reminder_15min) {
          shouldSend15min = true;
        }

        // Check if reminders were already sent
        const { data: reminderLogs } = await supabase
          .from('event_reminder_logs')
          .select('reminder_type')
          .eq('event_id', event.id)
          .eq('user_id', booking.user_id);
        
        const sentTypes = new Set((reminderLogs || []).map(log => log.reminder_type));
        
        // Send reminders that haven't been sent yet
        if (shouldSendLive && !sentTypes.has('event_live')) {
          remindersToSend.push({
            eventId: event.id,
            userId: booking.user_id,
            reminderType: 'event_live'
          });
        }
        
        if (shouldSend24h && !sentTypes.has('day_before')) {
          remindersToSend.push({
            eventId: event.id,
            userId: booking.user_id,
            reminderType: 'day_before'
          });
        }
        
        if (shouldSend2h && !sentTypes.has('hour_before')) {
          remindersToSend.push({
            eventId: event.id,
            userId: booking.user_id,
            reminderType: 'hour_before'
          });
        }
        
        if (shouldSend15min && !sentTypes.has('30_minutes_before')) {
          remindersToSend.push({
            eventId: event.id,
            userId: booking.user_id,
            reminderType: '30_minutes_before'
          });
        }
      }
    }

    // Send all reminders
    console.log(`Sending ${remindersToSend.length} reminders...`);
    
    for (const reminder of remindersToSend) {
      try {
        const response = await supabase.functions.invoke('send-event-reminder', {
          body: reminder
        });

        if (response.error) {
          console.error(`Failed to send reminder:`, response.error);
          remindersFailed++;
        } else {
          console.log(`Sent ${reminder.reminderType} reminder for event ${reminder.eventId}, user ${reminder.userId}`);
          remindersSent++;
        }
      } catch (error) {
        console.error(`Error sending reminder:`, error);
        remindersFailed++;
      }
    }

    console.log(`Event reminders cron job completed. Sent: ${remindersSent}, Skipped: ${remindersSkipped}, Failed: ${remindersFailed}`);

    return new Response(JSON.stringify({
      message: 'Event reminders processed successfully',
      stats: {
        sent: remindersSent,
        skipped: remindersSkipped,
        failed: remindersFailed,
        eventsProcessed: upcomingEvents?.length || 0,
        totalRemindersQueued: remindersToSend.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in event reminders cron job:', error);
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
