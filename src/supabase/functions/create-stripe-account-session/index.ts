
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.2.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Get the session user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting authenticated user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Get the user's profile to check if they have a Stripe Connect account
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!profile.stripe_connect_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe Connect account found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Stripe
    const stripe = new (await import('https://esm.sh/stripe@12.0.0')).default(STRIPE_SECRET_KEY);
    
    // Create an account session
    const session = await stripe.accountSessions.create({
      account: profile.stripe_connect_id,
      components: {
        account_onboarding: {
          enabled: true,
        },
        payment_details: {
          enabled: true,
        },
      },
      permissions: ['account_onboarding', 'financial_information', 'payment_methods'],
    });
    
    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating Stripe account session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
