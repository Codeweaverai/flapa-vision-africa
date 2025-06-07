
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PaymentConfirmationEmail } from './_templates/payment-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  email: string;
  customerName: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    type: 'course' | 'event_ticket';
    quantity: number;
    price: number;
  }>;
  receiptUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      customerName, 
      orderId, 
      amount, 
      currency, 
      paymentMethod, 
      items, 
      receiptUrl 
    }: PaymentConfirmationRequest = await req.json();

    const html = await renderAsync(
      React.createElement(PaymentConfirmationEmail, {
        customerName,
        orderId,
        amount,
        currency,
        paymentMethod,
        items,
        receiptUrl
      })
    );

    const emailResponse = await resend.emails.send({
      from: "SkillPulse Payments <payments@skillpulse.cloud>",
      to: [email],
      subject: `Payment Confirmation - Order #${orderId} ✅`,
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
    console.error("Error in send-payment-confirmation function:", error);
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
