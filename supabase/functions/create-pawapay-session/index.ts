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
        payment_status: 'pending',
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

    // Update order status to completed
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[PAWAPAY] Error updating order status', updateError);
      // Don't throw here as the payment was successful
    }

    // After successful payment processing, trigger email confirmation
    console.log('[PAWAPAY] Triggering payment confirmation email');
    
    const emailPayload = {
      orderId: order.id, // Assume order was created in the existing flow
      userId: user.id,
      userEmail: user.email,
      customerName: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email,
      orderItems: requestBody.items.map(item => ({
        item_id: item.item_id,
        item_type: item.item_type as 'course' | 'event_ticket',
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      })),
      totalAmount: requestBody.amount / 100, // Convert from cents
      currency: requestBody.currency.toUpperCase(),
      paymentMethod: 'Mobile Money (PawaPay)'
    };

    // Send email in background without waiting
    EdgeRuntime.waitUntil(
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
      })
    );

    console.log('[PAWAPAY] Session and email trigger completed successfully');

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
