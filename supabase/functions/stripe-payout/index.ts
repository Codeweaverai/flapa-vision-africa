
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StripePayoutRequest {
  creatorId: string;
  amount: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creatorId, amount, currency }: StripePayoutRequest = await req.json();
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    // Create Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get creator's Stripe Connect account ID and profile info
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, full_name, username')
      .eq('id', creatorId)
      .single();

    if (profileError || !profile) {
      throw new Error('Creator profile not found');
    }

    if (!profile.stripe_connect_account_id) {
      throw new Error('Creator does not have a connected Stripe account');
    }

    // Get creator's email from auth
    const { data: { user: creatorUser }, error: creatorUserError } = await supabaseClient.auth.admin.getUserById(creatorId);
    
    if (creatorUserError || !creatorUser?.email) {
      console.error('Error getting creator user email:', creatorUserError);
      throw new Error('Creator email not found');
    }

    // Create payout record in database first
    const { data: payoutRecord, error: payoutError } = await supabaseClient
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount: amount,
        currency: currency.toLowerCase(),
        method: 'stripe',
        payout_method: 'stripe',
        destination: 'Stripe Connected Account',
        status: 'processing'
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout record:', payoutError);
      throw new Error(`Failed to create payout record: ${payoutError.message}`);
    }

    console.log('Creating Stripe payout for:', {
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      connectedAccountId: profile.stripe_connect_account_id
    });

    // Create Stripe payout using the Payouts API
    const stripeResponse = await fetch("https://api.stripe.com/v1/payouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Account": profile.stripe_connect_account_id, // This specifies the connected account
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: currency.toLowerCase(),
        description: `Creator payout for ${profile.full_name || profile.username}`,
        statement_descriptor: "Creator Payout",
        metadata: JSON.stringify({
          creator_id: creatorId,
          payout_record_id: payoutRecord.id
        })
      }),
    });

    const stripeResult = await stripeResponse.json();
    console.log('Stripe payout response:', stripeResult);

    if (!stripeResponse.ok) {
      console.error("Stripe payout error:", stripeResult);
      
      // Update payout record with error
      await supabaseClient
        .from('creator_payouts')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutRecord.id);
        
      throw new Error(`Stripe payout failed: ${stripeResult.error?.message || 'Unknown error'}`);
    }

    // Update the payout record with Stripe payout details
    const { error: updateError } = await supabaseClient
      .from('creator_payouts')
      .update({
        stripe_payout_id: stripeResult.id,
        status: stripeResult.status === 'pending' ? 'processing' : 'completed',
        provider_payout_id: stripeResult.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutRecord.id);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // Send confirmation email
    try {
      await supabaseClient.functions.invoke('payout-confirmation-email', {
        body: {
          creatorEmail: creatorUser.email,
          creatorName: profile.full_name || profile.username || 'Creator',
          amount: amount,
          currency: currency.toUpperCase(),
          payoutId: payoutRecord.id,
          method: 'stripe',
          destination: 'Connected Bank Account'
        }
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the payout if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      payoutId: payoutRecord.id,
      stripePayoutId: stripeResult.id,
      status: stripeResult.status,
      arrivalDate: stripeResult.arrival_date,
      message: 'Payout created successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Stripe payout error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to process payout"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
