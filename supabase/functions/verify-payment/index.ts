
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCanvas } from 'https://esm.sh/canvas@2.11.2'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const { orderId, paymentStatus } = await req.json()
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Update order status to completed
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateOrderError) {
      console.error('Error updating order:', updateOrderError)
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const processedBookings = []

    // Process each order item
    for (const item of orderItems as OrderItem[]) {
      if (item.item_type === 'event_ticket') {
        // Get ticket details
        const { data: ticket, error: ticketError } = await supabase
          .from('event_tickets')
          .select('*')
          .eq('id', item.item_id)
          .single()

        if (ticketError || !ticket) {
          console.error('Error fetching ticket:', ticketError)
          continue
        }

        const eventTicket = ticket as EventTicket

        // Update ticket inventory
        const newQuantitySold = eventTicket.quantity_sold + item.quantity
        const newQuantityAvailable = eventTicket.quantity_available - item.quantity

        if (newQuantityAvailable < 0) {
          console.error('Insufficient ticket inventory')
          continue
        }

        const { error: updateTicketError } = await supabase
          .from('event_tickets')
          .update({
            quantity_sold: newQuantitySold,
            quantity_available: newQuantityAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.item_id)

        if (updateTicketError) {
          console.error('Error updating ticket inventory:', updateTicketError)
          continue
        }

        // Generate unique booking code
        const generateBookingCode = () => {
          return 'EVT-' + Math.random().toString(36).substr(2, 8).toUpperCase()
        }

        // Create event booking
        const bookingCode = generateBookingCode()
        
        const { data: booking, error: bookingError } = await supabase
          .from('event_bookings')
          .insert({
            user_id: order.user_id,
            event_id: eventTicket.event_id,
            event_ticket_id: item.item_id,
            order_id: orderId,
            booking_code: bookingCode,
            status: 'confirmed',
            payment_status: 'completed',
            payment_amount: item.total_price,
            payment_currency: order.currency || 'USD',
            ticket_quantity: item.quantity,
            booking_date: new Date().toISOString()
          })
          .select()
          .single()

        if (bookingError) {
          console.error('Error creating booking:', bookingError)
          continue
        }

        // Generate individual tickets with QR codes
        for (let i = 0; i < item.quantity; i++) {
          const ticketCode = `TCK-${order.user_id}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
          
          // Generate QR code data
          const qrData = JSON.stringify({
            ticketCode,
            bookingId: booking.id,
            eventId: eventTicket.event_id,
            orderId,
            userId: order.user_id,
            generatedAt: new Date().toISOString()
          })

          // Generate QR code as base64
          let qrCodeBase64 = ''
          try {
            qrCodeBase64 = await QRCode.toDataURL(qrData, {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
          } catch (qrError) {
            console.error('Error generating QR code:', qrError)
          }

          // Get user profile for ticket holder name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single()

          const ticketHolderName = profile?.full_name || `Ticket Holder ${i + 1}`

          // Insert generated ticket
          const { error: ticketInsertError } = await supabase
            .from('generated_tickets')
            .insert({
              booking_id: booking.id,
              event_id: eventTicket.event_id,
              order_id: orderId,
              user_id: order.user_id,
              event_ticket_id: item.item_id,
              ticket_code: ticketCode,
              ticket_holder_name: ticketHolderName,
              qr_code_data: qrData,
              qr_code_url: qrCodeBase64,
              ticket_status: 'active',
              generated_at: new Date().toISOString()
            })

          if (ticketInsertError) {
            console.error('Error inserting generated ticket:', ticketInsertError)
          }
        }

        processedBookings.push({
          bookingId: booking.id,
          bookingCode,
          ticketQuantity: item.quantity
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and tickets generated successfully',
        processedBookings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in verify-payment function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
