
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

const PAWAPAY_API_URL = "https://api.sandbox.pawapay.io/v1/widget/sessions";
const PAWAPAY_TOKEN = Deno.env.get("PAWAPAY_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface PaymentRequest {
  bookingId?: string;
  registrationId?: string;
  amount: number;
  currency: string;
  reason: string;
  userId: string;
  referenceType: 'event' | 'consultation';
  referenceId: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse the request body
    const paymentRequest = await req.json() as PaymentRequest;
    
    // Validate the request
    if (!paymentRequest.amount || !paymentRequest.currency || !paymentRequest.userId) {
      return new Response(
        JSON.stringify({ error: "Missing required payment information" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Generate unique deposit ID
    const depositId = uuidv4();
    
    // Create a return URL based on the payment type
    const baseUrl = new URL(req.url).origin;
    const returnUrl = `${baseUrl}/payment-result?type=${paymentRequest.referenceType}&id=${paymentRequest.referenceId}`;
    
    // Prepare the PawaPay request
    const pawaPayRequest = {
      depositId,
      amount: paymentRequest.amount.toString(),
      reason: paymentRequest.reason,
      returnUrl,
      statementDescription: "MbolelaConsult", // Must be 4-22 alphanumeric chars
      metadata: [
        {
          fieldName: "userId",
          fieldValue: paymentRequest.userId,
        },
        {
          fieldName: "referenceType",
          fieldValue: paymentRequest.referenceType,
        },
        {
          fieldName: "referenceId",
          fieldValue: paymentRequest.referenceId,
        }
      ]
    };

    // Make the request to PawaPay API
    const pawaPayResponse = await fetch(PAWAPAY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAWAPAY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pawaPayRequest),
    });

    if (!pawaPayResponse.ok) {
      const errorText = await pawaPayResponse.text();
      console.error("PawaPay API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Payment initiation failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const paymentData = await pawaPayResponse.json();

    // Record the payment transaction in our database
    const { data: transactionData, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: paymentRequest.userId,
        reference_type: paymentRequest.referenceType,
        reference_id: paymentRequest.referenceId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        status: "pending",
        provider: "pawapay",
        provider_transaction_id: depositId,
        metadata: {
          pawaPayDepositId: depositId,
          pawaPayResponse: paymentData
        }
      })
      .select();

    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
    }

    // Update the registration or booking record with the payment ID
    if (paymentRequest.referenceType === 'event' && paymentRequest.registrationId) {
      const { error: updateError } = await supabase
        .from("registrations")
        .update({
          payment_id: transactionData?.[0]?.id || depositId,
        })
        .eq('id', paymentRequest.registrationId);
      
      if (updateError) {
        console.error("Error updating registration:", updateError);
      }
    } else if (paymentRequest.referenceType === 'consultation' && paymentRequest.bookingId) {
      const { error: updateError } = await supabase
        .from("consultation_bookings")
        .update({
          payment_id: transactionData?.[0]?.id || depositId,
        })
        .eq('id', paymentRequest.bookingId);
      
      if (updateError) {
        console.error("Error updating booking:", updateError);
      }
    }

    // Return the redirect URL from PawaPay
    return new Response(
      JSON.stringify(paymentData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
