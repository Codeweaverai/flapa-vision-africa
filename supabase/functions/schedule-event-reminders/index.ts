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

    console.log('Setting up event reminders cron job...');

    // Enable pg_cron extension if not already enabled
    await supabase.rpc('enable_pg_cron');

    // Schedule the event reminders cron job to run every 15 minutes
    const cronQuery = `
      SELECT cron.schedule(
        'event-reminders-job',
        '*/15 * * * *',
        $$
        SELECT
          net.http_post(
            url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/event-reminders-cron',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
            body:='{"triggered_at": "' || now() || '"}'::jsonb
          ) as request_id;
        $$
      );
    `;

    const { data: cronResult, error: cronError } = await supabase.rpc('exec_sql', { 
      query: cronQuery 
    });

    if (cronError) {
      console.error('Failed to schedule cron job:', cronError);
      throw cronError;
    }

    // Also schedule a weekly course recommendations job (Sundays at 10 AM)
    const courseRecCronQuery = `
      SELECT cron.schedule(
        'course-recommendations-job',
        '0 10 * * 0',
        $$
        SELECT
          net.http_post(
            url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/send-course-recommendations',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
            body:='{"triggered_at": "' || now() || '"}'::jsonb
          ) as request_id;
        $$
      );
    `;

    const { data: courseRecResult, error: courseRecError } = await supabase.rpc('exec_sql', { 
      query: courseRecCronQuery 
    });

    if (courseRecError) {
      console.error('Failed to schedule course recommendations job:', courseRecError);
      // Don't throw error, event reminders are more critical
    }

    console.log('Cron jobs scheduled successfully');

    return new Response(JSON.stringify({
      message: 'Event reminders and course recommendations cron jobs scheduled successfully',
      eventRemindersCron: cronResult,
      courseRecommendationsCron: courseRecResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error setting up cron jobs:', error);
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