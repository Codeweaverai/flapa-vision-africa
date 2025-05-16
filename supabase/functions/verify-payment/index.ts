
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
    
    // In a real implementation, you would verify the payment status with PawaPay
    // For now, we'll simulate a successful payment
    const isPaymentSuccessful = true;
    const newStatus = isPaymentSuccessful ? 'completed' : 'failed';
    
    // Update the payment transaction status
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', txnId);
      
    // Update the related booking or registration
    if (transaction.reference_type === 'consultation') {
      await supabaseAdmin
        .from('consultation_bookings')
        .update({
          payment_status: newStatus,
          status: isPaymentSuccessful ? 'confirmed' : 'pending'
        })
        .eq('id', transaction.reference_id);
    } else if (transaction.reference_type === 'event') {
      await supabaseAdmin
        .from('registrations')
        .update({
          payment_status: newStatus,
          status: isPaymentSuccessful ? 'confirmed' : 'pending'
        })
        .eq('id', transaction.reference_id);
    }
    
    // Redirect the user to the payment result page
    const frontendUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/payment-result?status=${newStatus}&txnId=${txnId}`;
    
    // Redirect to the frontend
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': frontendUrl
      }
    });
  } catch (error) {
    console.error('Error processing payment verification:', error);
    const frontendUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/payment-result?status=error&message=${encodeURIComponent(error.message)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': frontendUrl
      }
    });
  }
});
