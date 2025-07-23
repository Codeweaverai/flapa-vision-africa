
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketCode, bookingCode, ticketHolderName } = await req.json();

    if (!ticketCode && !bookingCode) {
      throw new Error("Either ticket code or booking code is required");
    }

    let ticketData = null;

    // Verify by ticket code
    if (ticketCode) {
      const { data, error } = await supabaseClient
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings!generated_tickets_booking_id_fkey (
            *,
            event:events!event_bookings_event_id_fkey (
              title,
              start_time,
              end_time,
              location
            ),
            event_ticket:event_tickets!event_bookings_event_ticket_id_fkey (
              name,
              ticket_type,
              price
            )
          )
        `)
        .eq('ticket_code', ticketCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching ticket by code:", error);
        throw error;
      }

      if (data) {
        // Get user profile separately
        const { data: userProfile, error: userError } = await supabaseClient
          .from('profiles')
          .select('full_name, avatar_url, email')
          .eq('id', data.user_id)
          .single();

        if (userError) {
          console.error("Error fetching user profile:", userError);
        }

        ticketData = {
          ...data,
          user: userProfile || { full_name: 'Unknown User', avatar_url: null, email: 'N/A' }
        };
      }
    }

    // Verify by booking code if ticket code didn't work
    if (!ticketData && bookingCode) {
      const { data: bookingData, error: bookingError } = await supabaseClient
        .from('event_bookings')
        .select(`
          *,
          generated_tickets!generated_tickets_booking_id_fkey (
            *
          ),
          event:events!event_bookings_event_id_fkey (
            title,
            start_time,
            end_time,
            location
          ),
          event_ticket:event_tickets!event_bookings_event_ticket_id_fkey (
            name,
            ticket_type,
            price
          )
        `)
        .eq('booking_code', bookingCode)
        .single();

      if (bookingError && bookingError.code !== 'PGRST116') {
        console.error("Error fetching booking by code:", bookingError);
        throw bookingError;
      }

      if (bookingData && bookingData.generated_tickets?.length > 0) {
        // Get user profile separately
        const { data: userProfile, error: userError } = await supabaseClient
          .from('profiles')
          .select('full_name, avatar_url, email')
          .eq('id', bookingData.user_id)
          .single();

        if (userError) {
          console.error("Error fetching user profile:", userError);
        }

        // Use the first ticket from the booking
        ticketData = {
          ...bookingData.generated_tickets[0],
          booking: bookingData,
          user: userProfile || { full_name: 'Unknown User', avatar_url: null, email: 'N/A' }
        };
      }
    }

    if (!ticketData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'TICKET_NOT_FOUND',
        message: 'Invalid ticket or booking code'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404
      });
    }

    // Validate ticket holder name if provided
    if (ticketHolderName && ticketData.ticket_holder_name) {
      const normalizedInput = ticketHolderName.toLowerCase().trim();
      const normalizedTicket = ticketData.ticket_holder_name.toLowerCase().trim();
      
      if (!normalizedTicket.includes(normalizedInput) && !normalizedInput.includes(normalizedTicket)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'NAME_MISMATCH',
          message: 'Ticket holder name does not match'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        });
      }
    }

    // Check if booking is confirmed and payment completed
    if (ticketData.booking.status !== 'confirmed' || ticketData.booking.payment_status !== 'completed') {
      return new Response(JSON.stringify({
        success: false,
        error: 'BOOKING_NOT_CONFIRMED',
        message: 'Booking is not confirmed or payment not completed'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Check if event has started (optional validation)
    const eventStartTime = new Date(ticketData.booking.event.start_time);
    const currentTime = new Date();
    const hoursBeforeEvent = 2; // Allow check-in 2 hours before event

    if (currentTime < new Date(eventStartTime.getTime() - (hoursBeforeEvent * 60 * 60 * 1000))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'EVENT_NOT_STARTED',
        message: `Check-in opens ${hoursBeforeEvent} hours before the event`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Check if already checked in
    const isAlreadyCheckedIn = ticketData.checked_in;

    return new Response(JSON.stringify({
      success: true,
      ticket: {
        id: ticketData.id,
        ticket_code: ticketData.ticket_code,
        ticket_holder_name: ticketData.ticket_holder_name,
        checked_in: isAlreadyCheckedIn,
        booking_id: ticketData.booking_id,
        event_id: ticketData.booking.event_id,
        event: ticketData.booking.event,
        ticket_type: ticketData.booking.event_ticket,
        user: ticketData.user,
        booking: ticketData.booking
      },
      already_checked_in: isAlreadyCheckedIn
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error verifying ticket:", error);
    return new Response(JSON.stringify({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to verify ticket'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
