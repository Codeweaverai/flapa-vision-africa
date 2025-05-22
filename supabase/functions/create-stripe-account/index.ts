
// @ts-ignore - Deno imports will be available when deployed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; 
// @ts-ignore - Deno imports will be available when deployed
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 
// @ts-ignore - Deno imports will be available when deployed
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

// @ts-ignore - Deno namespace available at runtime
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');

// @ts-ignore - Deno serve method available at runtime
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
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

    // Get the request body
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error('Missing user_id in request body');
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    // Get user's email from auth.users
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Failed to fetch user');
    }

    // Create a Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update the user's profile with the Stripe account ID
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ stripe_connect_id: account.id })
      .eq('id', user_id);

    if (updateError) {
      throw new Error('Failed to update user profile with Stripe account ID');
    }

    return new Response(
      JSON.stringify({ account_id: account.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
