
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { TicketConfirmationEmail } from './_templates/ticket-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketConfirmationRequest {
  orderId: string;
  userEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, userEmail, userName }: TicketConfirmationRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order details with all related data
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          item_name,
          quantity,
          unit_price,
          total_price
        ),
        event_bookings (
          id,
          booking_code,
          ticket_quantity,
          event:events (
            title,
            start_time,
            end_time,
            location,
            image_url
          ),
          event_ticket:event_tickets (
            name,
            ticket_type
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error('Order not found');
    }

    // Generate ticket viewing URLs
    const ticketUrls = orderData.event_bookings.map((booking: any) => 
      `${Deno.env.get('SITE_URL') || 'https://skillpulse.cloud'}/tickets/${booking.id}`
    );

    const html = await renderAsync(
      React.createElement(TicketConfirmationEmail, {
        userName,
        orderData,
        ticketUrls,
        siteUrl: Deno.env.get('SITE_URL') || 'https://skillpulse.cloud'
      })
    );

    const emailResponse = await resend.emails.send({
      from: "SkillPulse Events <events@skillpulse.cloud>",
      to: [userEmail],
      subject: `Your Event Tickets - Order #${orderId.slice(0, 8)} 🎟️`,
      html,
    });

    console.log('Ticket confirmation email sent:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ticket-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
