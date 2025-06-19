
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    const { orderId, retry = false } = await req.json()

    if (!orderId) {
      throw new Error('Order ID is required')
    }

    console.log('[VERIFY-PAYMENT] Payment verification started -', { orderId })

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    console.log('[VERIFY-PAYMENT] Order found:', { 
      id: order.id, 
      status: order.payment_status, 
      method: order.payment_method,
      stripe_session_id: order.stripe_session_id,
      payment_provider_id: order.payment_provider_id
    })

    let paymentCompleted = false

    // Check Stripe payment if stripe session exists
    if (order.stripe_session_id && order.payment_method === 'card') {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      })

      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        console.log('[VERIFY-PAYMENT] Stripe session status:', session.payment_status)

        if (session.payment_status === 'paid') {
          paymentCompleted = true
          
          // Update order status
          const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
              payment_status: 'completed',
              stripe_payment_intent_id: session.payment_intent,
              receipt_url: session.receipt_url,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

          if (updateError) {
            console.error('[VERIFY-PAYMENT] Error updating order:', updateError)
          } else {
            console.log('[VERIFY-PAYMENT] Order updated to completed')
            
            // Process payment success (create enrollments, bookings, etc.)
            console.log('[VERIFY-PAYMENT] Starting order fulfillment -', { orderId })
            
            const { error: processError } = await supabaseClient.rpc('process_payment_success', {
              p_order_id: orderId,
              p_payment_intent_id: session.payment_intent,
              p_session_id: session.id
            })

            if (processError) {
              console.error('[VERIFY-PAYMENT] Error processing payment success:', processError)
            } else {
              console.log('[VERIFY-PAYMENT] Payment success processed')
              
              // Send ticket confirmation email
              try {
                // Get user profile for email
                const { data: profile } = await supabaseClient
                  .from('profiles')
                  .select('full_name')
                  .eq('id', order.user_id)
                  .single()

                await supabaseClient.functions.invoke('send-ticket-confirmation', {
                  body: {
                    orderId: order.id,
                    userEmail: order.email,
                    userName: profile?.full_name || 'Valued Customer'
                  }
                })
                
                console.log('[VERIFY-PAYMENT] Ticket confirmation email sent')
              } catch (emailError) {
                console.error('[VERIFY-PAYMENT] Error sending confirmation email:', emailError)
                // Don't fail the payment verification if email fails
              }
            }
          }
        }
      } catch (stripeError) {
        console.error('[VERIFY-PAYMENT] Error checking Stripe session:', stripeError)
      }
    }

    // Check PawaPay payment if payment_provider_id exists
    if (order.payment_provider_id && order.payment_method === 'mobile_money') {
      // For PawaPay, we rely on webhooks to update status
      // But we can check the current status in our database
      if (order.payment_status === 'completed') {
        paymentCompleted = true
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentCompleted,
        currentStatus: order.payment_status 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[VERIFY-PAYMENT] ERROR in payment verification -', { message: error.message })
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
