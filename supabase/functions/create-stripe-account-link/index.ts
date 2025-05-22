
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
    const { account_id } = await req.json();
    
    if (!account_id) {
      throw new Error('Missing Stripe account ID');
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account_id,
      refresh_url: `${req.headers.get('origin') || 'http://localhost:5173'}/creator/settings`,
      return_url: `${req.headers.get('origin') || 'http://localhost:5173'}/creator/settings`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating account link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
