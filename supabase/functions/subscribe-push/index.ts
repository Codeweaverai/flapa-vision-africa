import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subscription, action } = await req.json();

    if (action === 'subscribe') {
      if (!subscription || !subscription.endpoint) {
        return new Response(
          JSON.stringify({ error: 'Invalid subscription data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if subscription already exists
      const { data: existing } = await supabaseClient
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ message: 'Subscription already exists' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store subscription
      const { error: insertError } = await supabaseClient
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          subscription: subscription,
          endpoint: subscription.endpoint,
        });

      if (insertError) {
        console.error('Error storing subscription:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Push subscription created for user ${user.id}`);

      return new Response(
        JSON.stringify({ message: 'Subscription stored successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'unsubscribe') {
      if (!subscription || !subscription.endpoint) {
        return new Response(
          JSON.stringify({ error: 'Invalid subscription data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabaseClient
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (deleteError) {
        console.error('Error removing subscription:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Push subscription removed for user ${user.id}`);

      return new Response(
        JSON.stringify({ message: 'Subscription removed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in subscribe-push:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
