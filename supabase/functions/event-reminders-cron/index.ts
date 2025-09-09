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

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Get upcoming events with their bookings
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        start_time,
        event_bookings!inner (
          user_id,
          status
        ),
        notification_preferences (
          user_id,
          event_reminders_enabled,
          reminder_timing_hours
        )
      `)
      .gte('start_time', now.toISOString())
      .lte('start_time', twentyFourHoursFromNow.toISOString())
      .eq('event_bookings.status', 'confirmed');

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    console.log(`Found ${upcomingEvents?.length || 0} upcoming events`);

    let remindersSent = 0;
    let remindersSkipped = 0;
    let remindersFailed = 0;

    for (const event of upcomingEvents || []) {
      const eventStartTime = new Date(event.start_time);
      
      // Process each booking for this event
      for (const booking of event.event_bookings) {
        try {
          // Check user preferences
          const userPrefs = event.notification_preferences?.find(p => p.user_id === booking.user_id);
          if (!userPrefs?.event_reminders_enabled) {
            remindersSkipped++;
            continue;
          }

          const customTiming = userPrefs.reminder_timing_hours || 24;
          const customReminderTime = new Date(eventStartTime.getTime() - customTiming * 60 * 60 * 1000);

          // Determine which reminders to send
          const remindersToSend: Array<{ type: '24h' | '2h' | '15min', targetTime: Date }> = [];

          // 24-hour reminder (or custom timing)
          if (customTiming >= 24 && now >= customReminderTime && now < new Date(customReminderTime.getTime() + 30 * 60 * 1000)) {
            remindersToSend.push({ type: '24h', targetTime: customReminderTime });
          }

          // 2-hour reminder
          if (now >= new Date(eventStartTime.getTime() - 2 * 60 * 60 * 1000) && 
              now < new Date(eventStartTime.getTime() - 2 * 60 * 60 * 1000 + 30 * 60 * 1000)) {
            remindersToSend.push({ type: '2h', targetTime: twoHoursFromNow });
          }

          // 15-minute reminder
          if (now >= new Date(eventStartTime.getTime() - 15 * 60 * 1000) && 
              now < new Date(eventStartTime.getTime() - 15 * 60 * 1000 + 5 * 60 * 1000)) {
            remindersToSend.push({ type: '15min', targetTime: fifteenMinutesFromNow });
          }

          // Send reminders
          for (const reminder of remindersToSend) {
            // Check if reminder already sent
            const { data: existingReminder } = await supabase
              .from('event_reminder_logs')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', booking.user_id)
              .eq('reminder_type', reminder.type)
              .single();

            if (existingReminder) {
              console.log(`Reminder ${reminder.type} already sent for user ${booking.user_id}, event ${event.id}`);
              continue;
            }

            // Call the send-event-reminder function
            const reminderResponse = await supabase.functions.invoke('send-event-reminder', {
              body: {
                eventId: event.id,
                userId: booking.user_id,
                reminderType: reminder.type
              }
            });

            if (reminderResponse.error) {
              console.error(`Failed to send ${reminder.type} reminder:`, reminderResponse.error);
              remindersFailed++;
            } else {
              console.log(`Sent ${reminder.type} reminder for user ${booking.user_id}, event ${event.id}`);
              remindersSent++;
            }
          }

        } catch (error) {
          console.error(`Error processing reminder for user ${booking.user_id}, event ${event.id}:`, error);
          remindersFailed++;
        }
      }
    }

    console.log(`Event reminders cron job completed. Sent: ${remindersSent}, Skipped: ${remindersSkipped}, Failed: ${remindersFailed}`);

    return new Response(JSON.stringify({
      message: 'Event reminders processed successfully',
      stats: {
        sent: remindersSent,
        skipped: remindersSkipped,
        failed: remindersFailed,
        eventsProcessed: upcomingEvents?.length || 0
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