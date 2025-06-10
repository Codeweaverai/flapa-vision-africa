
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PAWAPAY_API_URL = 'https://api.sandbox.pawapay.io/v1/widget/sessions';
const PAWAPAY_TOKEN = Deno.env.get('PAWAPAY_TOKEN');

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PawaPay session creation...');
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

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
    } = await req.json();

    console.log('Request payload:', { amount, currency, msisdn, country, itemsCount: items?.length });

    if (!PAWAPAY_TOKEN) {
      console.error('PawaPay token not configured');
      throw new Error('PawaPay token not configured');
    }

    // Generate unique deposit ID
    const depositId = crypto.randomUUID();
    console.log('Generated deposit ID:', depositId);

    // Create order record in Supabase with only existing columns
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: amount / 100, // Convert back from cents
        currency: currency || 'USD',
        status: 'pending',
        payment_method: 'mobile_money',
        payment_status: 'pending',
        tax_amount: tax_amount || 0,
        promo_code: promo_code || null
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order: ' + orderError.message);
    }

    console.log('Order created successfully:', order.id);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      item_id: item.item_id,
      item_type: item.item_type,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      ticket_holder_names: item.ticket_holder_names || null
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items: ' + itemsError.message);
    }

    console.log('Order items created successfully');

    // Prepare statement description
    const statementDescription = items.length === 1 
      ? items[0].item_name 
      : `${items.length} items from SkillPulse`;

    // Determine reason based on items
    const hasEvents = items.some((item: any) => item.item_type === 'event_ticket');
    const hasCourses = items.some((item: any) => item.item_type === 'course');
    const reason = hasEvents && hasCourses ? 'Course & Event' : hasEvents ? 'Event' : 'Course';

    // Prepare metadata
    const metadata = [
      {
        isPII: false,
        fieldName: 'order_id',
        fieldValue: order.id
      },
      {
        isPII: false,
        fieldName: 'user_id',
        fieldValue: user.id
      },
      {
        isPII: false,
        fieldName: 'deposit_id',
        fieldValue: depositId
      }
    ];

    // Create PawaPay session
    const pawapayPayload = {
      metadata,
      returnUrl,
      depositId,
      statementDescription,
      amount: amount.toString(),
      msisdn,
      language: 'EN',
      country,
      reason
    };

    console.log('Creating PawaPay session with payload:', pawapayPayload);

    const pawapayResponse = await fetch(PAWAPAY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pawapayPayload),
    });

    const responseText = await pawapayResponse.text();
    console.log('PawaPay API response status:', pawapayResponse.status);
    console.log('PawaPay API response:', responseText);

    if (!pawapayResponse.ok) {
      console.error('PawaPay API error:', pawapayResponse.status, responseText);
      throw new Error(`PawaPay API error: ${pawapayResponse.status} - ${responseText}`);
    }

    let pawapayData;
    try {
      pawapayData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse PawaPay response:', parseError);
      throw new Error('Invalid response from PawaPay API');
    }

    console.log('PawaPay session created successfully:', pawapayData);

    // Update order with PawaPay session info
    await supabaseClient
      .from('orders')
      .update({
        provider_transaction_id: depositId,
        provider: 'pawapay',
        metadata: pawapayData
      })
      .eq('id', order.id);

    return new Response(JSON.stringify({
      success: true,
      redirectUrl: pawapayData.redirectUrl,
      depositId,
      orderId: order.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-pawapay-session:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
      details: error instanceof Error ? error.stack : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);
