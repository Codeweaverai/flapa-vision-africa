
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

interface Database {
  // Add your database types here
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the Stripe webhook secret from Supabase secrets
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing signature', { status: 400 })
    }

    // Get the raw body
    const body = await req.text()
    
    // Verify the webhook signature
    const encoder = new TextEncoder()
    const data = encoder.encode(body)
    
    // Extract timestamp and signature from header
    const elements = signature.split(',')
    let timestamp = ''
    let v1Signature = ''
    
    for (const element of elements) {
      const [key, value] = element.split('=')
      if (key === 't') {
        timestamp = value
      } else if (key === 'v1') {
        v1Signature = value
      }
    }

    if (!timestamp || !v1Signature) {
      console.error('Invalid signature format')
      return new Response('Invalid signature format', { status: 400 })
    }

    // Check if timestamp is recent (within 5 minutes)
    const timestampSeconds = parseInt(timestamp)
    const currentTime = Math.floor(Date.now() / 1000)
    const tolerance = 300 // 5 minutes
    
    if (Math.abs(currentTime - timestampSeconds) > tolerance) {
      console.error('Timestamp outside tolerance')
      return new Response('Timestamp outside tolerance', { status: 400 })
    }

    // Create the expected signature
    const payload = `${timestamp}.${body}`
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Compare signatures
    if (expectedSignature !== v1Signature) {
      console.error('Signature verification failed')
      return new Response('Invalid signature', { status: 400 })
    }

    // Parse the event
    const event = JSON.parse(body)
    console.log('Verified webhook event:', event.type)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function handleCheckoutCompleted(supabase: any, session: any) {
  console.log('Processing checkout completion for session:', session.id)
  
  try {
    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)

    if (error) {
      console.error('Error updating order:', error)
      throw error
    }

    console.log('Successfully updated order for session:', session.id)
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
    throw error
  }
}

async function handlePaymentSucceeded(supabase: any, paymentIntent: any) {
  console.log('Processing payment success for:', paymentIntent.id)
  
  try {
    // Update payment status
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating payment:', error)
      throw error
    }

    console.log('Successfully updated payment for:', paymentIntent.id)
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error)
    throw error
  }
}

async function handlePaymentFailed(supabase: any, paymentIntent: any) {
  console.log('Processing payment failure for:', paymentIntent.id)
  
  try {
    // Update payment status
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating failed payment:', error)
      throw error
    }

    console.log('Successfully updated failed payment for:', paymentIntent.id)
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
    throw error
  }
}
