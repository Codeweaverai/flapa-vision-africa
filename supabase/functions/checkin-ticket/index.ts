
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

    if (!ticketId || !bookingId || !eventId) {
      throw new Error("Missing required fields: ticketId, bookingId, eventId");
    }

    // First verify the ticket exists and is not already checked in
    const { data: ticketData, error: ticketError } = await supabaseClient
      .from('generated_tickets')
      .select('*')
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
        booking_id: bookingId,
        event_id: eventId,
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
