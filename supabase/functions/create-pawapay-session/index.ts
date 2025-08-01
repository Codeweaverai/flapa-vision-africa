
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PawaPayRequest {
  amount: number;
  currency: string;
  msisdn: string;
  country: string;
  returnUrl: string;
  items: Array<{
    item_type: string;
    item_id: string;
    item_name: string;
    title: string;
    quantity: number;
    price: number;
    ticket_holder_names?: string[];
  }>;
  tax_amount?: number;
  discount_amount?: number;
  promo_code?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PAWAPAY] Session creation started');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user?.email) {
      throw new Error("User not authenticated");
    }

    console.log('[PAWAPAY] User authenticated:', user.email);

    const requestBody: PawaPayRequest = await req.json();
    console.log('[PAWAPAY] Request body:', requestBody);

    const {
      amount,
      currency,
      msisdn,
      country,
      returnUrl,
      items,
      tax_amount,
      discount_amount,
      promo_code
    } = requestBody;

    const payload = {
      amount,
      currency,
      msisdn,
      country,
      return_url: returnUrl,
      items: items.map(item => ({
        item_type: item.item_type,
        item_id: item.item_id,
        item_name: item.title,
        quantity: item.quantity,
        price: item.price,
        ticket_holder_names: item.ticket_holder_names || []
      })),
      tax_amount: tax_amount || 0,
      discount_amount: discount_amount || 0,
      promo_code: promo_code || null,
    };

    console.log('[PAWAPAY] Payload:', payload);

    const pawaPayApiUrl = Deno.env.get("PAWAPAY_API_URL");
    const pawaPayApiKey = Deno.env.get("PAWAPAY_API_KEY");

    if (!pawaPayApiUrl || !pawaPayApiKey) {
      throw new Error("PawaPay API URL or API Key not set in environment variables");
    }

    const res = await fetch(`${pawaPayApiUrl}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": pawaPayApiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[PAWAPAY] PawaPay API Error:', data);
      throw new Error(`PawaPay API Error: ${data.message || res.statusText}`);
    }

    console.log('[PAWAPAY] PawaPay API Response:', data);

    const { redirectUrl, sessionId } = data;

    if (!redirectUrl) {
      throw new Error("No redirect URL received from PawaPay");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        currency: currency.toUpperCase(),
        payment_status: 'completed', // PawaPay payments are completed immediately
        payment_method: 'mobile_money',
        payment_provider_id: sessionId,
        email: user.email,
        tax_amount: tax_amount || 0,
        discount_amount: discount_amount || 0,
        promo_code: promo_code || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('[PAWAPAY] Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('[PAWAPAY] Order created successfully', { orderId: order.id });

    // Insert order items
    const orderItemsToInsert = items.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      item_type: item.item_type,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      metadata: {
        ticket_holder_names: item.ticket_holder_names || []
      }
    }));

    const { data: createdOrderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert)
      .select();

    if (itemsError) {
      console.error('[PAWAPAY] Error creating order items:', itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('[PAWAPAY] Order items created successfully', { count: createdOrderItems.length });

    // Process each order item - handle course enrollments and event tickets
    for (const orderItem of createdOrderItems) {
      if (orderItem.item_type === 'course') {
        console.log('[PAWAPAY] Creating course enrollment for item:', orderItem.item_id);
        
        // Create course enrollment
        const { error: enrollmentError } = await supabaseAdmin
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: orderItem.item_id,
            payment_status: 'completed',
            order_id: order.id,
            enrollment_date: new Date().toISOString()
          });

        if (enrollmentError) {
          console.error('[PAWAPAY] Error creating course enrollment:', enrollmentError);
          // Continue processing other items even if one fails
        } else {
          console.log('[PAWAPAY] Course enrollment created successfully');
        }

      } else if (orderItem.item_type === 'event_ticket') {
        console.log('[PAWAPAY] Processing event ticket for item:', orderItem.item_id);
        
        // Get event details from ticket
        const { data: eventTicket, error: ticketError } = await supabaseAdmin
          .from('event_tickets')
          .select(`
            *,
            events (*)
          `)
          .eq('id', orderItem.item_id)
          .single();

        if (ticketError || !eventTicket) {
          console.error('[PAWAPAY] Error fetching event ticket:', ticketError);
          continue;
        }

        const event = eventTicket.events;

        // Update ticket inventory
        const { error: inventoryError } = await supabaseAdmin
          .from('event_tickets')
          .update({
            quantity_available: Math.max(0, eventTicket.quantity_available - orderItem.quantity),
            quantity_sold: eventTicket.quantity_sold + orderItem.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderItem.item_id);

        if (inventoryError) {
          console.error('[PAWAPAY] Error updating ticket inventory:', inventoryError);
          // Continue processing
        }

        // Generate unique booking code
        const bookingCode = 'EVT-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        // Create event booking
        const { data: booking, error: bookingError } = await supabaseAdmin
          .from('event_bookings')
          .insert({
            user_id: user.id,
            event_id: event.id,
            event_ticket_id: orderItem.item_id,
            status: 'confirmed',
            payment_status: 'completed',
            payment_amount: orderItem.total_price,
            payment_currency: currency.toUpperCase(),
            ticket_quantity: orderItem.quantity,
            order_id: order.id,
            booking_date: new Date().toISOString(),
            booking_code: bookingCode
          })
          .select()
          .single();

        if (bookingError) {
          console.error('[PAWAPAY] Error creating event booking:', bookingError);
          continue;
        }

        console.log('[PAWAPAY] Event booking created successfully', { bookingId: booking.id });

        // Generate individual tickets for each quantity
        const ticketHolderNames = orderItem.metadata?.ticket_holder_names || [];
        
        for (let i = 0; i < orderItem.quantity; i++) {
          const ticketCode = 'TCK-' + user.id + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          
          const qrData = JSON.stringify({
            ticket_code: ticketCode,
            booking_id: booking.id,
            event_id: event.id,
            order_id: order.id,
            user_id: user.id,
            generated_at: new Date().toISOString()
          });

          const holderName = ticketHolderNames[i] || 
                           (await supabaseAdmin
                             .from('profiles')
                             .select('full_name')
                             .eq('id', user.id)
                             .single()
                           ).data?.full_name || 
                           `Ticket Holder ${i + 1}`;

          const { error: ticketError } = await supabaseAdmin
            .from('generated_tickets')
            .insert({
              booking_id: booking.id,
              event_id: event.id,
              order_id: order.id,
              user_id: user.id,
              ticket_holder_name: holderName,
              ticket_code: ticketCode,
              qr_code_data: qrData,
              ticket_status: 'active'
            });

          if (ticketError) {
            console.error('[PAWAPAY] Error generating ticket:', ticketError);
          } else {
            console.log('[PAWAPAY] Generated ticket:', ticketCode);
          }
        }
      }
    }

    // Trigger payment success email in background
    console.log('[PAWAPAY] Triggering payment confirmation email');
    
    const emailPayload = {
      orderId: order.id,
      userId: user.id,
      userEmail: user.email,
      customerName: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email,
      orderItems: items.map(item => ({
        item_id: item.item_id,
        item_type: item.item_type as 'course' | 'event_ticket',
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      })),
      totalAmount: totalAmount,
      currency: currency.toUpperCase(),
      paymentMethod: 'Mobile Money (PawaPay)'
    };

    // Send email in background without waiting
    supabaseAdmin.functions.invoke('send-payment-success-email', {
      body: emailPayload
    }).then(({ error: emailError }) => {
      if (emailError) {
        console.error('[PAWAPAY] Email sending failed:', emailError);
      } else {
        console.log('[PAWAPAY] Payment confirmation email sent successfully');
      }
    }).catch(emailError => {
      console.error('[PAWAPAY] Email sending error:', emailError);
    });

    console.log('[PAWAPAY] Session and order fulfillment completed successfully');

    return new Response(
      JSON.stringify({ redirectUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[PAWAPAY] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
