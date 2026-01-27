import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { BookingConfirmationEmail } from './_templates/booking-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    user_id: string;
    event_id: string;
    booking_code: string;
    ticket_quantity: number;
    event_ticket_id: string | null;
    payment_status: string;
    status: string;
    created_at: string;
  };
  schema: string;
  old_record: null | Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json();
    
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      console.log("Skipping non-INSERT event:", payload.type);
      return new Response(JSON.stringify({ message: "Skipped non-INSERT event" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const booking = payload.record;

    // Fetch user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(booking.user_id);
    
    if (userError || !userData?.user) {
      console.error("Error fetching user:", userError);
      throw new Error(`Failed to fetch user: ${userError?.message || 'User not found'}`);
    }

    // Fetch user profile for name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', booking.user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    const attendeeName = profile?.full_name || profile?.username || userData.user.email?.split('@')[0] || 'Attendee';
    const attendeeEmail = userData.user.email;

    if (!attendeeEmail) {
      throw new Error("User email not found");
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        event_type,
        location,
        online_meeting_link,
        image_url,
        creator_id
      `)
      .eq('id', booking.event_id)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event:", eventError);
      throw new Error(`Failed to fetch event: ${eventError?.message || 'Event not found'}`);
    }

    // Fetch organizer name
    const { data: organizer, error: organizerError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', event.creator_id)
      .single();

    if (organizerError) {
      console.error("Error fetching organizer:", organizerError);
    }

    const organizerName = organizer?.full_name || organizer?.username || 'Event Organizer';

    // Fetch ticket details if available
    let ticketName: string | undefined;
    let ticketCode: string | undefined;

    if (booking.event_ticket_id) {
      const { data: ticket, error: ticketError } = await supabase
        .from('event_tickets')
        .select('name')
        .eq('id', booking.event_ticket_id)
        .single();

      if (!ticketError && ticket) {
        ticketName = ticket.name;
      }
    }

    // Fetch generated ticket code if available
    const { data: generatedTicket, error: generatedTicketError } = await supabase
      .from('generated_tickets')
      .select('ticket_code')
      .eq('booking_id', booking.id)
      .limit(1)
      .maybeSingle();

    if (!generatedTicketError && generatedTicket) {
      ticketCode = generatedTicket.ticket_code;
    }

    // Format dates
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    const eventDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const eventTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const eventEndTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Determine event type for email template
    let eventType: 'online' | 'physical' | 'hybrid' = 'physical';
    if (event.event_type === 'online' || event.event_type === 'virtual') {
      eventType = 'online';
    } else if (event.event_type === 'hybrid') {
      eventType = 'hybrid';
    }

    console.log("Preparing email with data:", {
      attendeeName,
      attendeeEmail,
      eventTitle: event.title,
      eventType,
      bookingCode: booking.booking_code,
      ticketCode,
    });

    // Render the email template
    const html = await renderAsync(
      React.createElement(BookingConfirmationEmail, {
        attendeeName,
        eventTitle: event.title,
        eventDate,
        eventTime,
        eventEndTime,
        eventType,
        location: event.location || undefined,
        onlineMeetingLink: event.online_meeting_link || undefined,
        bookingCode: booking.booking_code,
        ticketCode,
        ticketName,
        ticketQuantity: booking.ticket_quantity || 1,
        organizerName,
        eventImageUrl: event.image_url || undefined,
        eventDescription: event.description || undefined,
      })
    );

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "SkillPulse Events <events@skillpulse.cloud>",
      to: [attendeeEmail],
      subject: `🎉 Your booking for "${event.title}" is confirmed!`,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email send in the database (optional - for tracking)
    try {
      await supabase
        .from('event_reminder_logs')
        .insert({
          event_id: booking.event_id,
          user_id: booking.user_id,
          reminder_type: 'booking_confirmation',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error("Error logging email send (non-critical):", logError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Booking confirmation email sent",
      emailId: emailResponse?.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-booking-confirmation function:", error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
