
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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get URL parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    // Find the payment in the database
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('provider_transaction_id', sessionId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }

    if (!payment) {
      throw new Error('Payment not found');
    }

    let paymentStatus = 'pending';
    
    // Determine payment status based on Stripe session status
    if (session.payment_status === 'paid') {
      paymentStatus = 'completed';
    } else if (session.status === 'open' || session.payment_status === 'unpaid') {
      paymentStatus = 'pending';
    } else if (session.status === 'expired' || session.status === 'canceled') {
      paymentStatus = 'failed';
    }

    // Update payment status
    if (payment.status !== paymentStatus) {
      await supabaseAdmin
        .from('payment_transactions')
        .update({ 
          status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
    }

    // Update the related record status based on reference_type
    if (paymentStatus === 'completed') {
      switch (payment.reference_type) {
        case 'course':
          await supabaseAdmin
            .from('course_enrollments')
            .update({ 
              payment_status: 'confirmed',
              payment_id: payment.id
            })
            .eq('course_id', payment.reference_id)
            .eq('user_id', payment.user_id);
          break;
          
        case 'event':
          await supabaseAdmin
            .from('event_bookings')
            .update({ 
              payment_status: 'confirmed',
              status: 'confirmed',
              payment_id: payment.id
            })
            .eq('event_id', payment.reference_id)
            .eq('user_id', payment.user_id);
          break;
          
        case 'consultation':
          await supabaseAdmin
            .from('consultation_bookings')
            .update({ 
              payment_status: 'confirmed',
              status: 'confirmed',
              payment_id: payment.id
            })
            .eq('id', payment.reference_id);
          break;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: paymentStatus,
        paymentId: payment.id
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
