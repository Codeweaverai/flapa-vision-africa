
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

    // Get creator's Stripe Connect account ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_id, email, full_name, username')
      .eq('id', creatorId)
      .single();

    if (profileError || !profile) {
      throw new Error('Creator profile not found');
    }

    if (!profile.stripe_connect_id) {
      throw new Error('Creator does not have a connected Stripe account');
    }

    // Create payout record
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
      throw new Error(`Failed to create payout record: ${payoutError.message}`);
    }

    // Create Stripe payout
    const stripeResponse = await fetch("https://api.stripe.com/v1/transfers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: (amount * 100).toString(), // Convert to cents
        currency: currency.toLowerCase(),
        destination: profile.stripe_connect_id,
        description: `Creator payout for ${profile.full_name || profile.username}`,
      }),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error("Stripe error:", errorData);
      
      // Update payout record with error
      await supabaseClient
        .from('creator_payouts')
        .update({ status: 'failed' })
        .eq('id', payoutRecord.id);
        
      throw new Error(`Stripe API error: ${stripeResponse.status}`);
    }

    const stripeResult = await stripeResponse.json();
    
    // Update the payout record with Stripe details
    const { error: updateError } = await supabaseClient
      .from('creator_payouts')
      .update({
        stripe_payout_id: stripeResult.id,
        status: 'completed',
        provider_payout_id: stripeResult.id
      })
      .eq('id', payoutRecord.id);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // Send confirmation email
    try {
      await supabaseClient.functions.invoke('payout-confirmation-email', {
        body: {
          email: profile.email,
          amount: amount,
          currency: currency.toUpperCase(),
          method: 'Stripe Connect',
          destination: 'Connected Bank Account',
          creatorName: profile.full_name || profile.username || 'Creator'
        }
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the payout if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      payoutId: payoutRecord.id,
      stripeTransferId: stripeResult.id,
      status: 'completed'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Stripe payout error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to process payout"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
