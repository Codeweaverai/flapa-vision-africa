
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
          <title>Unsubscribed - SkillPulse</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .logo {
              color: #f97316;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .checkmark {
              color: #22c55e;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(to right, #f97316, #a855f7);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">SkillPulse</div>
            <div class="checkmark">✓</div>
            <h1>Successfully Unsubscribed</h1>
            <p>You have been successfully unsubscribed from our newsletter.</p>
            <p>You will no longer receive newsletter emails from us.</p>
            <a href="https://skillpulse.cloud" class="button">Visit SkillPulse</a>
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
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - SkillPulse</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .logo {
              color: #f97316;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .error {
              color: #ef4444;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(to right, #f97316, #a855f7);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">SkillPulse</div>
            <div class="error">⚠</div>
            <h1>Oops! Something went wrong</h1>
            <p>We encountered an error while processing your unsubscribe request.</p>
            <p>Please try again later or contact our support team.</p>
            <a href="https://skillpulse.cloud" class="button">Visit SkillPulse</a>
          </div>
        </body>
      </html>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html', ...corsHeaders },
    });
  }
};

serve(handler);
