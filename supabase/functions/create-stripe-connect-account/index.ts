
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Define CORS headers
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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );
    
    // Verify the user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body to get the user ID
    const { userId } = await req.json();
    
    if (!userId || userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a Supabase service role client to access user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Check if the user already has a Stripe Connect account
    let stripeAccountId = profile.stripe_connect_id;
    
    if (!stripeAccountId) {
      // Create a new Express account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        business_type: 'individual',
        metadata: {
          userId: userId,
        },
      });
      
      stripeAccountId = account.id;
      
      // Save the Stripe Connect account ID to the user's profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_connect_id: stripeAccountId })
        .eq('id', userId);
    }
    
    // Generate an account link for onboarding
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/creator/payments?refresh=true`,
      return_url: `${origin}/creator/payments?success=true`,
      type: 'account_onboarding',
    });
    
    // Return the account link URL
    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
