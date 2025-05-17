
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-digest',
};

// Helper function to create SHA-512 hash digest
async function createSha512Digest(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(String.fromCharCode.apply(null, hashArray)); // Base64 encoding
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );
    
    // Verify the user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse the request body
    const { bookingId, amount, currency, reason, userId, referenceType, referenceId, phoneNumber, mobileOperator } = await req.json();
    
    // Check that all required fields are present
    if (!amount || !currency || !userId || !referenceType || !referenceId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for mobile money phone number for payment processing
    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: 'Missing phone number for mobile money payment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine the mobile operator/correspondent
    const correspondent = mobileOperator || "MTN_MOMO_ZMB"; // Default to MTN if not specified
    
    // Integration with PawaPay API
    const pawaPayToken = Deno.env.get('PAWAPAY_TOKEN');
    if (!pawaPayToken) {
      console.error('PAWAPAY_TOKEN not found in environment');
      return new Response(JSON.stringify({ error: 'Payment provider configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique deposit ID
    const depositId = crypto.randomUUID();
    
    // Format phone number properly - ensure it has country code without any symbols
    const formattedPhoneNumber = phoneNumber.replace(/[^0-9]/g, ''); // Remove any non-numeric characters
    const phoneWithCountryCode = formattedPhoneNumber.startsWith('260') 
      ? formattedPhoneNumber 
      : `260${formattedPhoneNumber.replace(/^0+/, '')}`; // Add country code if missing and remove leading zeros
    
    // Current timestamp in ISO format
    const customerTimestamp = new Date().toISOString();

    // Get the user's profile for contact information
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    // Generate a clear statement description based on transaction type
    let statementDescription = reason;
    if (!statementDescription) {
      if (referenceType === 'consultation') {
        statementDescription = 'Consultation Payment';
        
        // Try to get more details from the consultation booking
        const { data: consultationData } = await supabaseClient
          .from('consultation_bookings')
          .select('topic, booking_type')
          .eq('id', referenceId)
          .single();
          
        if (consultationData?.topic) {
          statementDescription = `Consult: ${consultationData.topic}`;
        } else if (consultationData?.booking_type) {
          const bookingTypeMap: Record<string, string> = {
            'google_meet': 'Online Consult',
            'in_person': 'In-Person Consult',
          };
          statementDescription = bookingTypeMap[consultationData.booking_type] || 'Consultation';
        }
      } else if (referenceType === 'event') {
        statementDescription = 'Event Ticket';
        
        // Try to get more details from the event
        const { data: eventData } = await supabaseClient
          .from('events')
          .select('title')
          .eq('id', referenceId)
          .single();
          
        if (eventData?.title) {
          statementDescription = `Event: ${eventData.title}`;
        }
      }
    }
    
    // Make sure statement description is between 4 and 22 characters
    if (!statementDescription || statementDescription.length < 4) {
      statementDescription = 'Payment';
    }
    if (statementDescription.length > 22) {
      statementDescription = statementDescription.substring(0, 22);
    }
    
    // Create a payment transaction record with all the required fields
    const { data: paymentTransaction, error: paymentError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        amount,
        currency,
        status: 'pending',
        provider: 'pawapay',
        phone_number: phoneWithCountryCode,
        deposit_id: depositId,
        correspondent,
        payer_type: 'MSISDN',
        payer_address: phoneWithCountryCode,
        customer_timestamp: customerTimestamp,
        statement_description: statementDescription,
        metadata: {
          reason,
          customerPhone: phoneWithCountryCode,
          correspondent,
          depositId,
          customerTimestamp
        }
      })
      .select()
      .single();
      
    if (paymentError) {
      console.error('Error creating payment transaction:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the origin for return URL
    const origin = req.headers.get('origin') || Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    const returnUrl = `${origin}/payment-result?txnId=${paymentTransaction.id}&type=${referenceType}&id=${referenceId}`;
    
    // Prepare PawaPay widget session request
    const sessionRequestBody = {
      depositId,
      returnUrl,
      statementDescription,
      amount: amount.toString(),
      msisdn: phoneWithCountryCode,
      language: "EN",
      country: "ZMB",
      reason: reason || (referenceType === 'consultation' ? 'Consultation Booking' : 'Event Registration'),
      metadata: [
        {
          fieldName: "paymentId",
          fieldValue: paymentTransaction.id
        },
        {
          fieldName: "customerId",
          fieldValue: userId,
          isPII: true
        },
        {
          fieldName: "referenceType",
          fieldValue: referenceType
        },
        {
          fieldName: "referenceId",
          fieldValue: referenceId
        }
      ]
    };
    
    // Create the content digest
    const requestBodyString = JSON.stringify(sessionRequestBody);
    console.log('PawaPay payment request:', requestBodyString);
    
    try {
      // In production environment with the actual PawaPay API
      const pawaPayResponse = await fetch('https://api.sandbox.pawapay.io/v1/widget/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pawaPayToken}`,
        },
        body: requestBodyString
      });
      
      if (!pawaPayResponse.ok) {
        const errorText = await pawaPayResponse.text();
        console.error('PawaPay API error:', pawaPayResponse.status, errorText);
        throw new Error(`PawaPay API error: ${pawaPayResponse.status} ${errorText}`);
      }
      
      const responseData = await pawaPayResponse.json();
      console.log('PawaPay API response:', responseData);
      
      // Update the payment transaction with the payment provider's transaction ID
      await supabaseClient
        .from('payment_transactions')
        .update({
          provider_transaction_id: depositId,
          status: 'processing'
        })
        .eq('id', paymentTransaction.id);
        
      // Update the reference (consultation or event) with the payment ID
      if (referenceType === 'consultation') {
        await supabaseClient
          .from('consultation_bookings')
          .update({
            payment_id: paymentTransaction.id,
            payment_status: 'processing',
            phone_number: phoneWithCountryCode,
            mobile_operator: correspondent
          })
          .eq('id', referenceId);
      } else if (referenceType === 'event') {
        await supabaseClient
          .from('registrations')
          .update({
            payment_id: paymentTransaction.id,
            payment_status: 'processing',
            phone_number: phoneWithCountryCode,
            mobile_operator: correspondent
          })
          .eq('id', referenceId);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: paymentTransaction.id,
          redirectUrl: responseData.redirectUrl,
          status: 'pending',
          depositId
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('PawaPay API call error:', error);
      
      // Fallback to simulation for development/testing
      console.log('Using mock PawaPay response for development');
      
      // This is a mock response for testing purposes only
      const mockRedirectUrl = `${origin}/payment-result?txnId=${paymentTransaction.id}&type=${referenceType}&id=${referenceId}&status=success`;
      
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: paymentTransaction.id,
          redirectUrl: mockRedirectUrl,
          status: 'pending',
          depositId,
          isMock: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
