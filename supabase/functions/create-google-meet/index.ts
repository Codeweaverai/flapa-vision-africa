
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For now, we'll simulate creating a Google Meet link
    // In a real implementation, you would use the Google Calendar API
    const { title, startTime, endTime, attendeeEmails } = await req.json();
    
    // This is a placeholder - in a real implementation you would:
    // 1. Use Google OAuth to access the calendar
    // 2. Create an event with conferencing data
    // 3. Return the meetLink from the response
    
    // Simulate a Google Meet link for now
    const randomId = Math.random().toString(36).substring(2, 10);
    const mockMeetLink = `https://meet.google.com/${randomId}`;
    
    console.log(`Created mock meeting: ${title}, Start: ${startTime}, End: ${endTime}`);
    console.log(`Attendees: ${attendeeEmails.join(', ')}`);
    
    return new Response(
      JSON.stringify({ 
        meetLink: mockMeetLink,
        success: true,
        message: "Mock Google Meet link created successfully"
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
