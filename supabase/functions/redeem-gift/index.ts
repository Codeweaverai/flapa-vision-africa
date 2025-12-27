
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedeemGiftRequest {
  giftCode: string;
  action: 'validate' | 'claim';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { giftCode, action }: RedeemGiftRequest = await req.json();

    // Validate gift code format to prevent enumeration attacks
    const giftCodePattern = /^GIFT-[A-Z0-9]{8}$/;
    if (!giftCode || !giftCodePattern.test(giftCode.toUpperCase())) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid gift code format'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch gift details using service role (bypasses RLS)
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('gift_code', giftCode.toUpperCase())
      .single();

    if (giftError || !gift) {
      // Return generic error to prevent code enumeration
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid or expired gift code'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // SECURITY: Verify the authenticated user's email matches the recipient email
    // This prevents attackers from claiming gifts intended for others
    const userEmail = user.email?.toLowerCase();
    const recipientEmail = gift.recipient_email?.toLowerCase();
    
    if (!userEmail || !recipientEmail || userEmail !== recipientEmail) {
      console.log(`Gift claim attempt denied: user email ${userEmail} does not match recipient ${recipientEmail}`);
      return new Response(JSON.stringify({
        success: false,
        message: 'This gift was sent to a different email address. Please sign in with the correct account.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if gift is still valid
    if (gift.status !== 'pending') {
      return new Response(JSON.stringify({
        success: false,
        message: 'This gift has already been claimed or expired'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (new Date(gift.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        message: 'This gift has expired'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'validate') {
      // Fetch item details for display
      let itemDetails = null;
      if (gift.item_type === 'course') {
        const { data } = await supabaseAdmin
          .from('courses')
          .select('title, description')
          .eq('id', gift.item_id)
          .single();
        itemDetails = data;
      } else if (gift.item_type === 'event') {
        const { data } = await supabaseAdmin
          .from('events')
          .select('title, description, start_time, location')
          .eq('id', gift.item_id)
          .single();
        itemDetails = data;
      }

      // Only return safe fields - exclude gift_code from response since user already has it
      return new Response(JSON.stringify({
        success: true,
        gift: {
          id: gift.id,
          gift_code: giftCode.toUpperCase(), // Return the code they provided, not from DB
          item_type: gift.item_type,
          item_id: gift.item_id,
          sender_name: gift.sender_name,
          recipient_name: gift.recipient_name,
          personal_message: gift.personal_message,
          status: gift.status,
          expires_at: gift.expires_at,
          item_details: itemDetails
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'claim') {
      // Start transaction
      try {
        // Update gift status
        const { error: updateError } = await supabaseAdmin
          .from('gifts')
          .update({
            status: 'claimed',
            claimed_at: new Date().toISOString(),
            claimed_by: user.id
          })
          .eq('id', gift.id);

        if (updateError) throw updateError;

        // Create enrollment or booking
        if (gift.item_type === 'course') {
          const { error: enrollError } = await supabaseAdmin
            .from('course_enrollments')
            .insert({
              user_id: user.id,
              course_id: gift.item_id,
              payment_status: 'completed',
              enrollment_date: new Date().toISOString()
            });

          if (enrollError) throw enrollError;
        } else if (gift.item_type === 'event') {
          // Get event ticket details
          const { data: ticket, error: ticketError } = await supabaseAdmin
            .from('event_tickets')
            .select('*')
            .eq('id', gift.item_id)
            .single();

          if (ticketError) throw ticketError;

          const { error: bookingError } = await supabaseAdmin
            .from('event_bookings')
            .insert({
              user_id: user.id,
              event_id: ticket.event_id,
              event_ticket_id: gift.item_id,
              status: 'confirmed',
              payment_status: 'completed',
              ticket_quantity: 1,
              booking_date: new Date().toISOString(),
              booking_code: `GIFT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            });

          if (bookingError) throw bookingError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Gift claimed successfully!'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      } catch (error) {
        console.error('Error claiming gift:', error);
        return new Response(JSON.stringify({
          success: false,
          message: 'Failed to claim gift. Please try again.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ success: false, message: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in redeem-gift function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
