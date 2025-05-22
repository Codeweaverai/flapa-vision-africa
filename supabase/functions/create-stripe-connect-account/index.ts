
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

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Check if the user already has a Stripe Connect account
    let stripeAccountId = profile.stripe_connect_id;
    
    try {
      if (!stripeAccountId) {
        console.log("Creating new Stripe Connect Express account");
        // Create a new Express account
        const account = await stripe.accounts.create({
          type: 'express',
          email: user.email,
          business_type: 'individual',
          metadata: {
            userId: userId,
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          settings: {
            payouts: {
              schedule: {
                interval: 'manual',
              },
            },
          }
        });
        
        stripeAccountId = account.id;
        console.log(`Created new Stripe account with ID: ${stripeAccountId}`);
        
        // Save the Stripe Connect account ID and status to the user's profile
        await supabaseAdmin
          .from('profiles')
          .update({ 
            stripe_connect_id: stripeAccountId,
            stripe_account_status: 'pending',
            stripe_payouts_enabled: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } else {
        console.log(`Using existing Stripe account with ID: ${stripeAccountId}`);
        
        // Refresh account details from Stripe
        try {
          const account = await stripe.accounts.retrieve(stripeAccountId);
          
          // Update status information
          await supabaseAdmin
            .from('profiles')
            .update({ 
              stripe_account_status: account.charges_enabled ? 'active' : 'pending',
              stripe_payouts_enabled: account.payouts_enabled,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        } catch (accountError) {
          console.error('Error retrieving Stripe account:', accountError);
          // Continue with account link creation even if account retrieval fails
        }
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
      console.error('Error in Stripe operation:', error);
      
      // Check if this is a Stripe Connect API error
      if (error.type === 'invalid_request_error' && error.message.includes('Connect')) {
        return new Response(JSON.stringify({ 
          error: 'Stripe Connect is not enabled for this account. Please contact support or upgrade your Stripe account to enable Connect features.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
