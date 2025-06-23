
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayoutRequest {
  amount: number;
  phone_number: string;
  operator: string;
  country: string;
  creator_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { amount, phone_number, operator, country, creator_id }: PayoutRequest = await req.json();
    
    // Validate that the authenticated user matches the creator_id
    if (user.id !== creator_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const pawaPayToken = Deno.env.get("PAWAPAY_TOKEN");
    if (!pawaPayToken) {
      throw new Error("PawaPay token not configured");
    }

    // Create Supabase client for database operations with service role
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get creator profile for email
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('email, full_name, username')
      .eq('id', creator_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('Creator profile not found');
    }

    // Create payout record first
    const { data: payoutRecord, error: payoutError } = await supabaseServiceClient
      .from('creator_payouts')
      .insert({
        creator_id: creator_id,
        amount: amount,
        currency: 'usd',
        method: 'mobile_money',
        payout_method: 'mobile_money',
        destination: `${operator} - ${phone_number}`,
        status: 'pending',
        mobile_money_details: {
          phone_number,
          operator,
          country
        }
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Payout record error:', payoutError);
      throw new Error(`Failed to create payout record: ${payoutError.message}`);
    }

    // Generate a unique deposit ID
    const depositId = `payout_${payoutRecord.id}_${Date.now()}`;
    
    // PawaPay payout request
    const pawaPayResponse = await fetch("https://api.pawapay.cloud/deposits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pawaPayToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositId: depositId,
        amount: (amount * 100).toString(), // Convert to cents
        currency: "USD",
        correspondent: operator,
        payer: {
          type: "MSISDN",
          address: {
            value: phone_number
          }
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: "Creator Payout"
      }),
    });

    if (!pawaPayResponse.ok) {
      const errorData = await pawaPayResponse.text();
      console.error("PawaPay error:", errorData);
      
      // Update payout record with error
      await supabaseServiceClient
        .from('creator_payouts')
        .update({ status: 'failed' })
        .eq('id', payoutRecord.id);
        
      throw new Error(`PawaPay API error: ${pawaPayResponse.status}`);
    }

    const pawaPayResult = await pawaPayResponse.json();
    
    // Update the payout record with PawaPay details
    const { error: updateError } = await supabaseServiceClient
      .from('creator_payouts')
      .update({
        pawapay_deposit_id: depositId,
        status: 'processing',
        provider_payout_id: depositId
      })
      .eq('id', payoutRecord.id);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // Send confirmation email
    try {
      await supabaseServiceClient.functions.invoke('payout-confirmation-email', {
        body: {
          email: profile.email,
          amount: amount,
          currency: 'USD',
          method: 'Mobile Money',
          destination: `${operator} - ${phone_number}`,
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
      depositId: depositId,
      status: 'processing'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payout error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to process payout"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
