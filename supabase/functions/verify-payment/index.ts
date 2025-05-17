
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract transaction ID from query parameters
    const url = new URL(req.url);
    const txnId = url.searchParams.get('txnId');
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');
    const statusParam = url.searchParams.get('status');
    
    if (!txnId) {
      return new Response(JSON.stringify({ error: 'Missing transaction ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create a service role client to access the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    // Get the payment transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('id', txnId)
      .single();
      
    if (error || !transaction) {
      console.error('Error fetching transaction:', error);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the deposit ID from the transaction
    const depositId = transaction.deposit_id;
    
    // Get the PawaPay token from environment
    const pawaPayToken = Deno.env.get('PAWAPAY_TOKEN');
    if (!pawaPayToken) {
      console.error('PAWAPAY_TOKEN not found in environment');
      return new Response(JSON.stringify({ error: 'Payment provider configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // In a production environment, verify the payment status with PawaPay API
    let paymentStatus;
    
    try {
      // Call PawaPay API to verify payment status
      const pawaPayResponse = await fetch(`https://api.sandbox.pawapay.io/v1/deposits/${depositId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pawaPayToken}`,
        }
      });
      
      if (pawaPayResponse.ok) {
        const responseData = await pawaPayResponse.json();
        console.log('PawaPay verification response:', responseData);
        paymentStatus = responseData.status;
      } else {
        // If we can't verify with PawaPay, use the status from URL parameter
        console.error('Error verifying with PawaPay:', await pawaPayResponse.text());
        paymentStatus = statusParam || 'pending';
      }
    } catch (error) {
      console.error('Error calling PawaPay API:', error);
      // Fallback to the status from URL parameter
      paymentStatus = statusParam || 'pending';
    }
    
    // Map PawaPay status to our internal status
    let newStatus;
    switch (paymentStatus?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'successful':
        newStatus = 'completed';
        break;
      case 'failed':
      case 'failure':
      case 'error':
        newStatus = 'failed';
        break;
      case 'processing':
      case 'pending':
      default:
        newStatus = 'pending';
    }
    
    // Update the payment transaction status
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', txnId);
      
    // Update the related booking or registration
    const referenceType = type || transaction.reference_type;
    const referenceId = id || transaction.reference_id;
    
    if (referenceType === 'consultation') {
      await supabaseAdmin
        .from('consultation_bookings')
        .update({
          payment_status: newStatus,
          status: newStatus === 'completed' ? 'confirmed' : (newStatus === 'failed' ? 'pending' : 'pending')
        })
        .eq('id', referenceId);
    } else if (referenceType === 'event') {
      await supabaseAdmin
        .from('registrations')
        .update({
          payment_status: newStatus,
          status: newStatus === 'completed' ? 'confirmed' : (newStatus === 'failed' ? 'pending' : 'pending')
        })
        .eq('id', referenceId);
    }
    
    // Determine frontend URL
    const frontendUrl = Deno.env.get('FRONTEND_URL') || req.headers.get('origin') || 'http://localhost:5173';
    
    // Build the redirect URL
    const redirectUrl = `${frontendUrl}/payment-result?status=${newStatus}&txnId=${txnId}&type=${referenceType}&id=${referenceId}`;
    
    // Return JSON response for API calls or redirect for browser requests
    const acceptHeader = req.headers.get('Accept') || '';
    if (acceptHeader.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          referenceType,
          referenceId,
          txnId,
          redirectUrl
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      // Redirect to the frontend
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl
        }
      });
    }
  } catch (error) {
    console.error('Error processing payment verification:', error);
    
    // Determine frontend URL for error redirect
    const frontendUrl = Deno.env.get('FRONTEND_URL') || req.headers.get('origin') || 'http://localhost:5173';
    const errorUrl = `${frontendUrl}/payment-result?status=error&message=${encodeURIComponent(error.message)}`;
    
    // Return JSON error for API calls or redirect for browser requests
    const acceptHeader = req.headers.get('Accept') || '';
    if (acceptHeader.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorUrl
        }
      });
    }
  }
});
