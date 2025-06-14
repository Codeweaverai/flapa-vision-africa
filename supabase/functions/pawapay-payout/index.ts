
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
  payout_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, phone_number, operator, country, payout_id }: PayoutRequest = await req.json();
    
    const pawaPayToken = Deno.env.get("PAWAPAY_TOKEN");
    if (!pawaPayToken) {
      throw new Error("PawaPay token not configured");
    }

    // Create Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate a unique deposit ID
    const depositId = `payout_${payout_id}_${Date.now()}`;
    
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
      throw new Error(`PawaPay API error: ${pawaPayResponse.status}`);
    }

    const pawaPayResult = await pawaPayResponse.json();
    
    // Update the payout record with PawaPay details
    const { error: updateError } = await supabaseClient
      .from('creator_payouts')
      .update({
        pawapay_deposit_id: depositId,
        status: 'processing',
        provider_payout_id: depositId
      })
      .eq('id', payout_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
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
