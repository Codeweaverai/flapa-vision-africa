
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { EventConfirmationEmail } from './_templates/event-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventConfirmationRequest {
  email: string;
  attendeeName: string;
  eventTitle: string;
  eventId: string;
  eventDate: string;
  eventTime: string;
  location: string;
  ticketCode: string;
  qrCodeData: string;
  organizerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      attendeeName, 
      eventTitle, 
      eventId, 
      eventDate, 
      eventTime, 
      location, 
      ticketCode, 
      qrCodeData, 
      organizerName 
    }: EventConfirmationRequest = await req.json();

    const html = await renderAsync(
      React.createElement(EventConfirmationEmail, {
        attendeeName,
        eventTitle,
        eventId,
        eventDate,
        eventTime,
        location,
        ticketCode,
        qrCodeData,
        organizerName
      })
    );

    const emailResponse = await resend.emails.send({
      from: "SkillPulse Events <events@skillpulse.cloud>",
      to: [email],
      subject: `Your ticket for "${eventTitle}" 🎟️`,
      html,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-event-confirmation function:", error);
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
