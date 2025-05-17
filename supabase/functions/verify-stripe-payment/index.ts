
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
    // Extract session ID from query parameters or body
    const url = new URL(req.url);
    let sessionId = url.searchParams.get('sessionId');
    
    // If not in query parameters, try to get from request body
    if (!sessionId && req.headers.get('Content-Type')?.includes('application/json')) {
      const body = await req.json();
      sessionId = body.sessionId;
    }
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing session ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    // Get the payment transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('provider_transaction_id', sessionId)
      .single();
      
    if (txError || !transaction) {
      console.error('Error fetching transaction:', txError);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Get the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Determine payment status based on Stripe session
    let paymentStatus;
    if (session.payment_status === 'paid') {
      paymentStatus = 'completed';
    } else if (session.status === 'expired' || session.status === 'canceled') {
      paymentStatus = 'failed';
    } else {
      paymentStatus = 'pending';
    }
    
    // Update the payment transaction status
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);
      
    // Update the related booking or registration
    const referenceType = transaction.reference_type;
    const referenceId = transaction.reference_id;
    
    if (referenceType === 'consultation') {
      await supabaseAdmin
        .from('consultation_bookings')
        .update({
          payment_status: paymentStatus,
          status: paymentStatus === 'completed' ? 'confirmed' : (paymentStatus === 'failed' ? 'pending' : 'pending'),
          payment_id: transaction.id,
          payment_amount: transaction.amount,
          payment_currency: transaction.currency
        })
        .eq('id', referenceId);
    } else if (referenceType === 'event') {
      // Update in the event_bookings table
      await supabaseAdmin
        .from('event_bookings')
        .update({
          payment_status: paymentStatus,
          status: paymentStatus === 'completed' ? 'confirmed' : (paymentStatus === 'failed' ? 'pending' : 'pending'),
          payment_id: transaction.id,
          payment_amount: transaction.amount,
          payment_currency: transaction.currency
        })
        .eq('id', referenceId);
    }
    
    // Determine frontend URL
    const frontendUrl = Deno.env.get('FRONTEND_URL') || req.headers.get('origin') || 'http://localhost:5173';
    
    // Build the redirect URL
    const redirectUrl = `${frontendUrl}/payment-result?status=${paymentStatus}&type=${referenceType}&id=${referenceId}`;
    
    // Return JSON response
    return new Response(
      JSON.stringify({
        success: true,
        status: paymentStatus,
        sessionId,
        redirectUrl
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
