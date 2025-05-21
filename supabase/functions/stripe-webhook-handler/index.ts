
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

// This function doesn't require JWT verification since Stripe calls it directly
serve(async (req) => {
  // Get the webhook signature from the request headers
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("No Stripe signature found");
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  try {
    // Extract the request body as text for verification
    const body = await req.text();
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Webhook received: ${event.type}`);

    // Create a Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object, supabaseAdmin);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabaseAdmin, stripe);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabaseAdmin);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabaseAdmin);
        break;
      
      case 'payout.created':
      case 'payout.updated':
      case 'payout.paid':
        await handlePayoutEvent(event.data.object, event.type, supabaseAdmin);
        break;
      
      case 'account.application.authorized':
        console.log('Account application authorized:', event.data.object);
        break;
      
      case 'account.application.deauthorized':
        console.log('Account application deauthorized:', event.data.object);
        await handleAccountDeauthorized(event.data.object, supabaseAdmin);
        break;
    }

    // Return a successful response
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${error.message}` }),
      { status: 400 }
    );
  }
});

// Handle account.updated event
async function handleAccountUpdated(account: any, supabase: any) {
  try {
    // Find the user with this Stripe account ID
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_connect_id', account.id);
    
    if (error || !profiles.length) {
      console.error('Error finding profile for Stripe account:', error || 'No profile found');
      return;
    }
    
    const profile = profiles[0];
    
    // Update any relevant profile fields based on account status
    const updates: any = {
      stripe_account_status: account.charges_enabled ? 'active' : 'pending',
      stripe_payouts_enabled: account.payouts_enabled,
      updated_at: new Date().toISOString()
    };
    
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);
    
    console.log(`Updated profile for user ${profile.id} with Stripe account status`);
  } catch (error) {
    console.error('Error handling account.updated webhook:', error);
  }
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: any, supabase: any, stripe: any) {
  try {
    // Find the payment transaction using the checkout session ID
    const { data: payment, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('provider_transaction_id', session.id)
      .single();
    
    if (error || !payment) {
      console.error('Error finding payment for session:', error || 'No payment found');
      return;
    }
    
    // Update the payment status to completed
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);
    
    // Update the related record based on reference_type
    switch (payment.reference_type) {
      case 'course':
        await supabase
          .from('course_enrollments')
          .update({
            payment_status: 'confirmed',
            payment_id: payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('course_id', payment.reference_id)
          .eq('user_id', payment.user_id);
        break;
        
      case 'event':
        await supabase
          .from('event_bookings')
          .update({
            payment_status: 'confirmed',
            status: 'confirmed',
            payment_id: payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('event_id', payment.reference_id)
          .eq('user_id', payment.user_id);
        break;
    }
    
    console.log(`Updated payment ${payment.id} and related records for session ${session.id}`);
  } catch (error) {
    console.error('Error handling checkout.session.completed webhook:', error);
  }
}

// Handle payment_intent.succeeded event
async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any) {
  try {
    // Update any payment records linked to this payment intent
    const { data: payments, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('provider_transaction_id', paymentIntent.id);
    
    if (error) {
      console.error('Error finding payments for payment intent:', error);
      return;
    }
    
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
        
        console.log(`Updated payment ${payment.id} for payment intent ${paymentIntent.id}`);
      }
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded webhook:', error);
  }
}

// Handle payment_intent.payment_failed event
async function handlePaymentIntentFailed(paymentIntent: any, supabase: any) {
  try {
    // Update any payment records linked to this payment intent
    const { data: payments, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('provider_transaction_id', paymentIntent.id);
    
    if (error) {
      console.error('Error finding payments for failed payment intent:', error);
      return;
    }
    
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
        
        console.log(`Updated payment ${payment.id} as failed for payment intent ${paymentIntent.id}`);
      }
    }
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed webhook:', error);
  }
}

// Handle payout events (created, updated, paid)
async function handlePayoutEvent(payout: any, eventType: string, supabase: any) {
  try {
    // Find the connected account this payout belongs to
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_connect_id', payout.destination);
    
    if (error || !profiles.length) {
      console.error('Error finding profile for payout destination:', error || 'No profile found');
      return;
    }
    
    const profile = profiles[0];
    
    // Update or create a record in creator_payouts table
    const { data: existingPayout, error: lookupError } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('provider_payout_id', payout.id)
      .single();
    
    if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected if it's a new payout
      console.error('Error looking up existing payout:', lookupError);
      return;
    }
    
    // Determine status based on event type
    let status = 'pending';
    if (eventType === 'payout.paid') {
      status = 'completed';
    } else if (payout.status === 'failed' || payout.status === 'canceled') {
      status = 'failed';
    }
    
    if (existingPayout) {
      // Update existing payout record
      await supabase
        .from('creator_payouts')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayout.id);
      
      console.log(`Updated payout record ${existingPayout.id} with status ${status}`);
    } else if (eventType === 'payout.created') {
      // Create new payout record
      await supabase.from('creator_payouts').insert({
        creator_id: profile.id,
        amount: payout.amount / 100, // Stripe amounts are in cents
        currency: payout.currency.toUpperCase(),
        method: 'stripe',
        destination: `Stripe (${payout.destination.slice(-4)})`,
        status,
        provider: 'stripe',
        provider_payout_id: payout.id
      });
      
      console.log(`Created new payout record for ${profile.id} with amount ${payout.amount / 100} ${payout.currency}`);
    }
  } catch (error) {
    console.error(`Error handling ${eventType} webhook:`, error);
  }
}

// Handle account.application.deauthorized event
async function handleAccountDeauthorized(account: any, supabase: any) {
  try {
    // Find the user with this Stripe account ID
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_connect_id', account.id);
    
    if (error || !profiles.length) {
      console.error('Error finding profile for deauthorized account:', error || 'No profile found');
      return;
    }
    
    // Update profile to remove Stripe Connect ID and status
    await supabase
      .from('profiles')
      .update({
        stripe_connect_id: null,
        stripe_account_status: 'disconnected',
        stripe_payouts_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', profiles[0].id);
    
    console.log(`Removed Stripe Connect association for user ${profiles[0].id}`);
  } catch (error) {
    console.error('Error handling account.application.deauthorized webhook:', error);
  }
}
