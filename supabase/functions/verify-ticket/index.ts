
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface VerifyTicketRequest {
  ticketCode?: string;
  bookingCode?: string;
  ticketHolderName?: string;
  verifierUserId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      ticketCode, 
      bookingCode, 
      ticketHolderName,
      verifierUserId 
    }: VerifyTicketRequest = await req.json();

    console.log('Ticket verification request:', { ticketCode, bookingCode, ticketHolderName, verifierUserId });

    if (!ticketCode && !bookingCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Either ticket code or booking code is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let ticketQuery = supabase
      .from('generated_tickets')
      .select(`
        *,
        booking:event_bookings!generated_tickets_booking_id_fkey (
          booking_code,
          status,
          payment_status
        ),
        event:events!generated_tickets_event_id_fkey (
          id,
          title,
          start_time,
          end_time,
          location,
          creator_id,
          workplace_id
        ),
        check_ins (
          check_in_time,
          checked_in_by
        )
      `);

    // Search by ticket code or booking code
    if (ticketCode) {
      ticketQuery = ticketQuery.eq('ticket_code', ticketCode);
    } else if (bookingCode) {
      // Find tickets by booking code
      const { data: bookingData, error: bookingError } = await supabase
        .from('event_bookings')
        .select('id')
        .eq('booking_code', bookingCode)
        .single();

      if (bookingError || !bookingData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'No booking found with this code' 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      ticketQuery = ticketQuery.eq('booking_id', bookingData.id);
    }

    const { data: tickets, error: ticketError } = await ticketQuery.limit(1);

    if (ticketError) {
      console.error('Database error:', ticketError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Database error occurred' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!tickets || tickets.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Ticket not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const ticket = tickets[0];

    // Check if the verifier is authorized (event creator or workplace owner/editor)
    if (verifierUserId) {
      let isAuthorized = false;
      
      // Check if verifier is the event creator
      if (ticket.event?.creator_id === verifierUserId) {
        isAuthorized = true;
      }
      
      // Check if verifier is a workplace owner or editor (if event has workplace_id)
      if (!isAuthorized && ticket.event?.workplace_id) {
        const { data: membership, error: membershipError } = await supabase
          .from('creator_workplace_members')
          .select('role')
          .eq('user_id', verifierUserId)
          .eq('workplace_id', ticket.event.workplace_id)
          .eq('status', 'active')
          .in('role', ['owner', 'editor'])
          .single();

        if (!membershipError && membership) {
          isAuthorized = true;
        }
      }
      
      if (!isAuthorized) {
        console.log('Unauthorized verification attempt:', {
          verifierUserId,
          eventCreatorId: ticket.event?.creator_id,
          eventId: ticket.event?.id,
          workplaceId: ticket.event?.workplace_id
        });
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'unauthorized',
            message: 'You are not authorized to verify tickets for this event' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Additional verification by ticket holder name if provided
    if (ticketHolderName && ticket.ticket_holder_name) {
      const providedName = ticketHolderName.toLowerCase().trim();
      const actualName = ticket.ticket_holder_name.toLowerCase().trim();
      
      if (!actualName.includes(providedName) && !providedName.includes(actualName)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Ticket holder name does not match' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Check if ticket is already checked in
    const alreadyCheckedIn = ticket.checked_in || (ticket.check_ins && ticket.check_ins.length > 0);

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', ticket.user_id)
      .single();

    // Get user email
    const { data: userEmails, error: emailError } = await supabase.rpc('get_user_emails', { 
      user_ids: [ticket.user_id] 
    });

    const userEmail = userEmails?.[0]?.email || '';

    // Get ticket type information (mock data for now, as we don't have ticket types table)
    const ticketType = {
      name: ticket.booking?.status === 'confirmed' ? 'General Admission' : 'Pending',
      ticket_type: 'standard',
      price: 0 // You might want to get this from booking or event data
    };

    const response = {
      success: true,
      already_checked_in: alreadyCheckedIn,
      ticket: {
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        ticket_holder_name: ticket.ticket_holder_name,
        checked_in: ticket.checked_in || false,
        booking_id: ticket.booking_id,
        event_id: ticket.event_id,
        event: {
          title: ticket.event?.title || 'Unknown Event',
          start_time: ticket.event?.start_time || '',
          end_time: ticket.event?.end_time || '',
          location: ticket.event?.location || 'Unknown Location',
          creator_id: ticket.event?.creator_id,
          workplace_id: ticket.event?.workplace_id
        },
        ticket_type: ticketType,
        user: {
          full_name: userProfile?.full_name || userProfile?.username || 'Unknown User',
          avatar_url: userProfile?.avatar_url,
          email: userEmail
        },
        booking: {
          booking_code: ticket.booking?.booking_code || '',
          status: ticket.booking?.status || 'pending',
          payment_status: ticket.booking?.payment_status || 'pending'
        }
      }
    };

    console.log('Ticket verification successful');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-ticket function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
