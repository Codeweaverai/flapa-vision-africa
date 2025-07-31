
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { CoursePaymentEmail } from './_templates/course-payment-email.tsx';
import { EventPaymentEmail } from './_templates/event-payment-email.tsx';
import { generateReceiptPDF } from './_utils/pdf-generator.ts';
import { generateEventTicketPDF } from './_utils/ticket-pdf-generator.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface PaymentEmailRequest {
  orderId: string;
  userId: string;
  userEmail: string;
  customerName: string;
  orderItems: Array<{
    item_id: string;
    item_type: 'course' | 'event_ticket';
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: PaymentEmailRequest = await req.json();
    console.log('[PAYMENT-EMAIL] Processing email for order:', requestData.orderId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate receipt PDF
    const receiptPDF = await generateReceiptPDF({
      orderId: requestData.orderId,
      customerName: requestData.customerName,
      userEmail: requestData.userEmail,
      items: requestData.orderItems,
      totalAmount: requestData.totalAmount,
      currency: requestData.currency,
      paymentMethod: requestData.paymentMethod
    });

    const attachments = [
      {
        content: receiptPDF,
        filename: `receipt-${requestData.orderId}.pdf`,
        type: 'application/pdf'
      }
    ];

    // Check if order contains event tickets
    const hasEventTickets = requestData.orderItems.some(item => item.item_type === 'event_ticket');
    const hasCourses = requestData.orderItems.some(item => item.item_type === 'course');

    let emailHtml = '';
    let emailSubject = '';

    if (hasEventTickets) {
      // Fetch event ticket data
      const { data: generatedTickets, error: ticketError } = await supabaseAdmin
        .from('generated_tickets')
        .select(`
          *,
          event_bookings!inner(*),
          events!inner(
            title,
            start_time,
            end_time,
            location,
            event_type,
            online_meeting_link
          ),
          event_tickets!inner(
            name,
            ticket_type,
            price
          )
        `)
        .eq('order_id', requestData.orderId)
        .eq('user_id', requestData.userId);

      if (ticketError) {
        console.error('[PAYMENT-EMAIL] Error fetching tickets:', ticketError);
        throw new Error('Failed to fetch event ticket details');
      }

      console.log('[PAYMENT-EMAIL] Found tickets:', generatedTickets?.length);

      // Generate individual ticket PDFs
      if (generatedTickets && generatedTickets.length > 0) {
        for (const ticket of generatedTickets) {
          const ticketPDF = await generateEventTicketPDF({
            ticketCode: ticket.ticket_code,
            eventTitle: ticket.events.title,
            eventDate: ticket.events.start_time,
            eventTime: `${new Date(ticket.events.start_time).toLocaleTimeString()} - ${new Date(ticket.events.end_time).toLocaleTimeString()}`,
            location: ticket.events.location || ticket.events.online_meeting_link || 'Virtual Event',
            ticketType: ticket.event_tickets.name,
            ticketHolderName: ticket.ticket_holder_name,
            qrCodeData: ticket.qr_code_data,
            bookingCode: ticket.event_bookings.booking_code
          });

          attachments.push({
            content: ticketPDF,
            filename: `ticket-${ticket.ticket_code}.pdf`,
            type: 'application/pdf'
          });
        }

        // Render event email template
        emailHtml = await renderAsync(
          React.createElement(EventPaymentEmail, {
            customerName: requestData.customerName,
            orderId: requestData.orderId,
            tickets: generatedTickets.map(ticket => ({
              eventTitle: ticket.events.title,
              eventDate: ticket.events.start_time,
              location: ticket.events.location || 'Virtual Event',
              ticketType: ticket.event_tickets.name,
              ticketCode: ticket.ticket_code,
              holderName: ticket.ticket_holder_name
            })),
            totalAmount: requestData.totalAmount,
            currency: requestData.currency
          })
        );

        emailSubject = `Your Event Tickets - Order #${requestData.orderId} 🎟️`;
      }
    } else if (hasCourses) {
      // Fetch course data
      const courseIds = requestData.orderItems
        .filter(item => item.item_type === 'course')
        .map(item => item.item_id);

      const { data: courses, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .in('id', courseIds);

      if (courseError) {
        console.error('[PAYMENT-EMAIL] Error fetching courses:', courseError);
        throw new Error('Failed to fetch course details');
      }

      // Render course email template
      emailHtml = await renderAsync(
        React.createElement(CoursePaymentEmail, {
          customerName: requestData.customerName,
          orderId: requestData.orderId,
          courses: courses || [],
          totalAmount: requestData.totalAmount,
          currency: requestData.currency
        })
      );

      emailSubject = `Start Learning - Order #${requestData.orderId} 📚`;
    }

    // Send email with attachments
    const emailResponse = await resend.emails.send({
      from: "SkillPulse Learning <noreply@skillpulse.cloud>",
      to: [requestData.userEmail],
      subject: emailSubject,
      html: emailHtml,
      attachments: attachments
    });

    console.log('[PAYMENT-EMAIL] Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-payment-success-email function:", error);
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
