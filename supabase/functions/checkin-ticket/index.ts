
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
    const { ticketId, bookingId, eventId, checkedInBy } = await req.json();

    if (!ticketId || !checkedInBy) {
      throw new Error("Missing required fields: ticketId, checkedInBy");
    }

    // First verify the ticket exists and get event and booking details
    const { data: ticketData, error: ticketError } = await supabaseClient
      .from('generated_tickets')
      .select(`
        *,
        event:events!generated_tickets_event_id_fkey (
          id,
          creator_id,
          workplace_id
        ),
        booking:event_bookings!generated_tickets_booking_id_fkey (
          id
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticketData) {
      throw new Error("Ticket not found");
    }

    if (ticketData.checked_in) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ALREADY_CHECKED_IN',
        message: 'Ticket has already been checked in'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Check authorization - event creator or workplace owner/editor
    let isAuthorized = false;
    
    // Check if user is the event creator
    if (ticketData.event?.creator_id === checkedInBy) {
      isAuthorized = true;
    }
    
    // Check if user is a workplace owner or editor (if event has workplace_id)
    if (!isAuthorized && ticketData.event?.workplace_id) {
      const { data: membership, error: membershipError } = await supabaseClient
        .from('creator_workplace_members')
        .select('role')
        .eq('user_id', checkedInBy)
        .eq('workplace_id', ticketData.event.workplace_id)
        .eq('status', 'active')
        .in('role', ['owner', 'editor'])
        .single();

      if (!membershipError && membership) {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      return new Response(JSON.stringify({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You are not authorized to check in tickets for this event'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403
      });
    }

    // Use the actual data from ticket lookup
    const actualBookingId = ticketData.booking?.id || bookingId;
    const actualEventId = ticketData.event?.id || eventId;

    // Check if there's already a check-in record for this ticket
    const { data: existingCheckin } = await supabaseClient
      .from('check_ins')
      .select('id')
      .eq('ticket_id', ticketId)
      .single();

    if (existingCheckin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'DUPLICATE_CHECKIN',
        message: 'Check-in record already exists for this ticket'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Start transaction to update ticket and create check-in record
    const { error: updateError } = await supabaseClient
      .from('generated_tickets')
      .update({ 
        checked_in: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      throw updateError;
    }

    // Create check-in record
    const { data: checkinData, error: checkinError } = await supabaseClient
      .from('check_ins')
      .insert({
        ticket_id: ticketId,
        booking_id: actualBookingId,
        event_id: actualEventId,
        checked_in_by: checkedInBy,
        check_in_time: new Date().toISOString()
      })
      .select()
      .single();

    if (checkinError) {
      // Rollback the ticket update if check-in creation fails
      await supabaseClient
        .from('generated_tickets')
        .update({ checked_in: false })
        .eq('id', ticketId);
      
      throw checkinError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Ticket checked in successfully',
      checkin: checkinData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error checking in ticket:", error);
    return new Response(JSON.stringify({
      success: false,
      error: 'CHECKIN_FAILED',
      message: error.message || 'Failed to check in ticket'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
