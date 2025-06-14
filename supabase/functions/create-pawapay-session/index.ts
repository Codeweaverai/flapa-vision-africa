
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);

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

    console.log('Request payload:', { amount, currency, msisdn, country, itemsCount: items?.length });

    if (!PAWAPAY_TOKEN) {
      console.error('PawaPay token not configured');
      throw new Error('PawaPay token not configured');
    }

    if (!amount || !currency || !msisdn || !country || !items || !returnUrl) {
      console.error('Missing required fields:', { amount, currency, msisdn, country, items: !!items, returnUrl: !!returnUrl });
      throw new Error('Missing required payment fields');
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Validate phone number format
    if (!msisdn.match(/^\d{10,15}$/)) {
      throw new Error('Invalid phone number format');
    }

    // Generate unique deposit ID
    const depositId = crypto.randomUUID();
    console.log('Generated deposit ID:', depositId);

    // Create order record in Supabase using service role
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const orderData = {
      user_id: user.id,
      total_amount: amount / 100, // Convert back from cents
      currency: currency || 'USD',
      payment_method: 'mobile_money',
      payment_status: 'pending',
      tax_amount: tax_amount || 0,
      email: user.email || '',
      payment_provider_id: depositId
    };

    console.log('Creating order with data:', orderData);

    const { data: order, error: orderError } = await serviceRoleClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order: ' + orderError.message);
    }

    console.log('Order created successfully:', order.id);

    // Create order items using service role
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      item_id: item.item_id,
      item_type: item.item_type,
      item_name: item.item_name || item.title || 'Item',
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      metadata: {
        ticket_holder_names: item.ticket_holder_names || null
      }
    }));

    const { error: itemsError } = await serviceRoleClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items: ' + itemsError.message);
    }

    console.log('Order items created successfully');

    // Prepare statement description (4-22 characters as per PawaPay docs)
    let statementDescription = 'SkillPulse Purchase';
    if (items.length === 1 && items[0].item_name) {
      const itemName = items[0].item_name.substring(0, 18);
      statementDescription = itemName.length >= 4 ? itemName : 'SkillPulse Purchase';
    }

    // Determine reason based on items
    const hasEvents = items.some((item: any) => item.item_type === 'event_ticket');
    const hasCourses = items.some((item: any) => item.item_type === 'course');
    const reason = hasEvents && hasCourses ? 'Course & Event' : hasEvents ? 'Event' : 'Course';

    // Prepare metadata as per PawaPay documentation (simplified)
    const metadata = [
      {
        "fieldName": "orderId",
        "fieldValue": order.id
      },
      {
        "fieldName": "userId", 
        "fieldValue": user.id
      }
    ];

    // Create PawaPay session with exact format from documentation
    const pawapayPayload = {
      "depositId": depositId,
      "returnUrl": returnUrl,
      "statementDescription": statementDescription,
      "amount": Math.round(amount / 100).toString(), // Convert cents to major currency unit
      "msisdn": msisdn,
      "language": "EN",
      "country": country,
      "reason": reason,
      "metadata": metadata
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
      
      let errorMessage = 'Payment service error';
      
      try {
        const errorData = JSON.parse(responseText);
        
        if (pawapayResponse.status === 400) {
          errorMessage = `Invalid request: ${errorData.errorMessage || 'Bad request'}`;
        } else if (pawapayResponse.status === 401) {
          errorMessage = 'Authentication failed with payment provider';
        } else if (pawapayResponse.status === 403) {
          errorMessage = 'Access denied by payment provider';
        } else if (pawapayResponse.status === 500) {
          errorMessage = 'Payment service temporarily unavailable';
        }
        
        console.error('Parsed error data:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    let pawapayData;
    try {
      pawapayData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse PawaPay response:', parseError);
      throw new Error('Invalid response from payment provider');
    }

    // Validate response format
    if (!pawapayData.redirectUrl) {
      console.error('Missing redirectUrl in response:', pawapayData);
      throw new Error('Payment provider did not return a valid payment URL');
    }

    console.log('PawaPay session created successfully:', pawapayData);

    // Update order with PawaPay session info
    await serviceRoleClient
      .from('orders')
      .update({
        receipt_url: pawapayData.redirectUrl
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
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);
