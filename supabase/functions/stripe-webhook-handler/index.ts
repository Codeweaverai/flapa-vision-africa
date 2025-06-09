
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const sig = req.headers.get('stripe-signature')
    const body = await req.text()
    
    // Verify webhook signature (you should implement this with your Stripe webhook secret)
    const event = JSON.parse(body)

    console.log('Received Stripe webhook:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      console.log('Processing checkout session:', session.id)

      // Extract metadata
      const { orderId, userId, type } = session.metadata || {}
      
      if (!orderId) {
        throw new Error('Order ID not found in session metadata')
      }

      // Update order with Stripe payment details
      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          receipt_url: session.receipt_url,
          receipt_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) {
        throw new Error(`Failed to update order: ${orderError.message}`)
      }

      // Process the payment success
      const { data, error } = await supabaseClient.rpc('process_payment_success', {
        p_order_id: orderId,
        p_payment_intent_id: session.payment_intent,
        p_session_id: session.id
      })

      if (error) {
        throw new Error(`Failed to process payment success: ${error.message}`)
      }

      // Trigger ticket generation for events
      if (type === 'event') {
        const { error: ticketError } = await supabaseClient.functions.invoke('generate-tickets', {
          body: { orderId, sessionId: session.id }
        })

        if (ticketError) {
          console.error('Failed to generate tickets:', ticketError)
        }
      }

      console.log('Payment processed successfully for order:', orderId)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
