// This file is for a Supabase Edge Function and should be deployed using Supabase CLI.
// The TypeScript errors related to Deno imports and APIs can be safely ignored
// as these are provided by the Deno runtime environment when deployed to Supabase.

// @ts-ignore - Deno imports will be available when deployed
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - Deno imports will be available when deployed
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - Deno imports will be available when deployed
import Stripe from 'https://esm.sh/stripe@14.21.0';

// @ts-ignore - Deno namespace available at runtime in Supabase Edge Functions
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// @ts-ignore - Deno serve method available at runtime
Deno.serve(async (req) => {
  // @ts-ignore - Deno request processing
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      // @ts-ignore - Deno env available at runtime
      Deno.env.get('SUPABASE_URL') || '',
      // @ts-ignore - Deno env available at runtime
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the user from the client
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get the request body
    const { returnUrl } = await req.json();

    if (!returnUrl) {
      throw new Error('Missing returnUrl in request body');
    }

    // Get the user's profile to check if they already have a Stripe account
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_account_id, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    let accountId = profile.stripe_account_id;

    // If the user doesn't have a Stripe account, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email || user.email,
        business_type: 'individual',
        individual: {
          email: profile.email || user.email,
          first_name: profile.full_name?.split(' ')[0] || '',
          last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Update the user's profile with the Stripe account ID
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Failed to update user profile with Stripe account ID');
      }
    }

    // Create an account link for the user to onboard with Stripe
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${returnUrl}?session=failed`,
      return_url: `${returnUrl}?session=success`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
