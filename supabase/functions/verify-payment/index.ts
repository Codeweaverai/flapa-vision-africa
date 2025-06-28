
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

    const { orderId, sessionId, paymentIntentId, retry = false } = await req.json()

    if (!orderId) {
      throw new Error('Order ID is required')
    }

    console.log('[VERIFY-PAYMENT] Starting verification for order:', orderId)

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_id,
          item_type,
          item_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    console.log('[VERIFY-PAYMENT] Order found:', { 
      id: order.id, 
      status: order.payment_status, 
      method: order.payment_method,
      items: order.order_items?.length || 0
    })

    let paymentCompleted = false

    // Verify Stripe payment if applicable
    if (order.stripe_session_id && order.payment_method === 'stripe') {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      })

      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        console.log('[VERIFY-PAYMENT] Stripe session status:', session.payment_status)

        if (session.payment_status === 'paid') {
          paymentCompleted = true
        }
      } catch (stripeError) {
        console.error('[VERIFY-PAYMENT] Stripe verification error:', stripeError)
      }
    }

    // For PawaPay, payment status is updated via webhook
    if (order.payment_method === 'mobile_money' && order.payment_status === 'completed') {
      paymentCompleted = true
    }

    // Process payment success if completed
    if (paymentCompleted && order.payment_status !== 'completed') {
      console.log('[VERIFY-PAYMENT] Processing payment success for order:', orderId)
      
      try {
        // Call the improved process_payment_success function
        const { data: processResult, error: processError } = await supabaseClient.rpc(
          'process_payment_success',
          {
            p_order_id: orderId,
            p_payment_intent_id: paymentIntentId,
            p_session_id: sessionId
          }
        )

        if (processError) {
          console.error('[VERIFY-PAYMENT] Error processing payment success:', processError)
          throw processError
        }

        console.log('[VERIFY-PAYMENT] Payment success processed successfully')

        // Generate QR codes for tickets
        const { data: tickets, error: ticketsError } = await supabaseClient
          .from('generated_tickets')
          .select('*')
          .eq('order_id', orderId)

        if (!ticketsError && tickets) {
          for (const ticket of tickets) {
            // Generate base64 QR code using a simple approach
            const qrData = encodeURIComponent(ticket.qr_code_data)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`
            
            await supabaseClient
              .from('generated_tickets')
              .update({ qr_code_url: qrUrl })
              .eq('id', ticket.id)
          }
          console.log('[VERIFY-PAYMENT] QR codes generated for', tickets.length, 'tickets')
        }

        // Send confirmation email
        try {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single()

          await supabaseClient.functions.invoke('send-payment-confirmation', {
            body: {
              orderId: order.id,
              userEmail: order.email,
              userName: profile?.full_name || 'Valued Customer',
              orderItems: order.order_items
            }
          })
          
          console.log('[VERIFY-PAYMENT] Confirmation email sent')
        } catch (emailError) {
          console.error('[VERIFY-PAYMENT] Email sending failed:', emailError)
          // Don't fail the whole process if email fails
        }

      } catch (fulfillmentError) {
        console.error('[VERIFY-PAYMENT] Order fulfillment error:', fulfillmentError)
        
        // If it's an inventory error, mark order as failed
        if (fulfillmentError.message?.includes('Insufficient ticket inventory')) {
          await supabaseClient
            .from('orders')
            .update({ 
              payment_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
        }
        
        throw fulfillmentError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentCompleted,
        currentStatus: order.payment_status,
        processed: paymentCompleted && order.payment_status === 'completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[VERIFY-PAYMENT] ERROR:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
