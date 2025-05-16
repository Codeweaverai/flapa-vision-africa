
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const PAWAPAY_API_URL = "https://api.sandbox.pawapay.io/deposits";
const PAWAPAY_TOKEN = Deno.env.get("PAWAPAY_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface VerifyPaymentRequest {
  paymentId: string;
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
    const verifyRequest = await req.json() as VerifyPaymentRequest;
    
    // Initialize Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Get the payment transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", verifyRequest.paymentId)
      .single();

    if (transactionError || !transactionData) {
      return new Response(
        JSON.stringify({ error: "Payment transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check payment status with PawaPay
    const depositId = transactionData.provider_transaction_id;
    const pawaPayResponse = await fetch(`${PAWAPAY_API_URL}/${depositId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PAWAPAY_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!pawaPayResponse.ok) {
      const errorText = await pawaPayResponse.text();
      console.error("PawaPay API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const paymentStatus = await pawaPayResponse.json();
    let newStatus = "pending";
    
    // Map PawaPay status to our status
    if (paymentStatus.status === "COMPLETED") {
      newStatus = "completed";
    } else if (paymentStatus.status === "FAILED" || paymentStatus.status === "EXPIRED") {
      newStatus = "failed";
    } else if (paymentStatus.status === "ACCEPTED") {
      newStatus = "processing";
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        metadata: {
          ...transactionData.metadata,
          pawaPayStatus: paymentStatus
        }
      })
      .eq('id', verifyRequest.paymentId);
    
    if (updateError) {
      console.error("Error updating transaction status:", updateError);
    }

    // Update the registration or booking status
    if (verifyRequest.referenceType === 'event') {
      const { error: registrationError } = await supabase
        .from("registrations")
        .update({
          payment_status: newStatus,
          status: newStatus === "completed" ? "confirmed" : "pending"
        })
        .eq('event_id', verifyRequest.referenceId)
        .eq('payment_id', verifyRequest.paymentId);
      
      if (registrationError) {
        console.error("Error updating registration:", registrationError);
      }
    } else if (verifyRequest.referenceType === 'consultation') {
      const { error: bookingError } = await supabase
        .from("consultation_bookings")
        .update({
          payment_status: newStatus,
          status: newStatus === "completed" ? "confirmed" : "pending"
        })
        .eq('id', verifyRequest.referenceId)
        .eq('payment_id', verifyRequest.paymentId);
      
      if (bookingError) {
        console.error("Error updating booking:", bookingError);
      }

      // If payment is completed and it's a Google Meet booking, create the meeting
      if (newStatus === "completed") {
        const { data: booking } = await supabase
          .from("consultation_bookings")
          .select("*")
          .eq('id', verifyRequest.referenceId)
          .single();
        
        if (booking && booking.booking_type === "google_meet") {
          // In a real implementation, you would integrate with Google Calendar API here
          // For now, we'll simulate by generating a fake meeting link
          const meetingId = Math.random().toString(36).substring(2, 10);
          const meetingLink = `https://meet.google.com/${meetingId}`;
          
          await supabase
            .from("consultation_bookings")
            .update({
              online_meeting_link: meetingLink
            })
            .eq('id', verifyRequest.referenceId);
        }
      }
    }

    // Return the current payment status
    return new Response(
      JSON.stringify({ 
        status: newStatus, 
        pawaPayStatus: paymentStatus.status,
        referenceType: verifyRequest.referenceType,
        referenceId: verifyRequest.referenceId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
