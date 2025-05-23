
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// Set up CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    // Get the session ID from the request
    const { sessionId, itemType, itemId } = await req.json();
    if (!sessionId || !itemType || !itemId) {
      throw new Error('Missing required parameters');
    }

    // Create Stripe client
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create Supabase client using the service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );
    
    // Authenticate the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }
    
    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the payment was successful
    const paymentStatus = session.payment_status;
    const paymentSuccessful = paymentStatus === 'paid';

    // Record the payment result in the database based on the item type
    if (paymentSuccessful) {
      if (itemType === 'course') {
        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', itemId)
          .maybeSingle();
          
        if (!existingEnrollment) {
          // Create course enrollment
          await supabase.from('course_enrollments').insert({
            user_id: user.id,
            course_id: itemId,
            payment_status: 'paid',
            enrollment_date: new Date().toISOString()
          });
        } else {
          // Update existing enrollment
          await supabase
            .from('course_enrollments')
            .update({ payment_status: 'paid' })
            .eq('id', existingEnrollment.id);
        }
      } 
      else if (itemType === 'event') {
        // Check if registration already exists
        const { data: existingRegistration } = await supabase
          .from('registrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', itemId)
          .maybeSingle();
          
        if (!existingRegistration) {
          // Create event registration
          await supabase.from('registrations').insert({
            user_id: user.id,
            event_id: itemId,
            status: 'confirmed',
            payment_status: 'paid',
            payment_id: session.id,
            created_at: new Date().toISOString()
          });
        } else {
          // Update existing registration
          await supabase
            .from('registrations')
            .update({ payment_status: 'paid', status: 'confirmed' })
            .eq('id', existingRegistration.id);
        }
      }

      // Record payment transaction
      await supabase.from('payment_transactions').insert({
        user_id: user.id,
        reference_id: itemId,
        reference_type: itemType,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
        status: 'completed',
        provider: 'stripe',
        provider_transaction_id: session.id,
      });
    }

    return new Response(JSON.stringify({ 
      success: paymentSuccessful,
      status: paymentStatus,
      session: session
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
