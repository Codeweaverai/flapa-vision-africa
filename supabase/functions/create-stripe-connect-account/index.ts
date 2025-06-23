
// The TypeScript errors related to Deno imports are expected and can be ignored
// since these are Deno-specific imports that run in the Supabase Edge Function environment
// and not in the browser. They will work correctly when deployed to Supabase.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
    
    // Parse request body
    const body = await req.json();
    const { userId } = body;
    
    // Validate that the authenticated user matches the userId
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name, stripe_connect_account_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // If user already has a Stripe account, return it
    if (profile.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ accountId: profile.stripe_connect_account_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: profile.email,
      business_profile: {
        name: profile.full_name || 'Creator',
        product_description: 'Educational content creation',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      external_account: 'bank_account',
    });
    
    // Update profile with Stripe account ID
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        stripe_connect_account_id: account.id,
        stripe_onboarding_completed: false
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with Stripe account ID:', updateError);
      // Continue anyway, as the account was created successfully
    }
    
    return new Response(
      JSON.stringify({ accountId: account.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
