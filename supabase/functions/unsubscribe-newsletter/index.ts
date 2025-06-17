
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Invalid unsubscribe link', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Decode user ID from token
    const userId = atob(token);

    // Update user's newsletter subscription status
    const { error } = await supabase
      .from('profiles')
      .update({ newsletter_subscribed: false })
      .eq('id', userId);

    if (error) {
      console.error('Error unsubscribing user:', error);
      throw error;
    }

    // Return a simple HTML page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Unsubscribed</h1>
            <p>You have been successfully unsubscribed from our newsletter.</p>
            <p>You will no longer receive newsletter emails from us.</p>
          </div>
        </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html', ...corsHeaders },
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('An error occurred while unsubscribing', {
      status: 500,
      headers: corsHeaders,
    });
  }
};

serve(handler);
