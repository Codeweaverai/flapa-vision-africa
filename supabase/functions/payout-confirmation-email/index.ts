
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayoutEmailRequest {
  email: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  creatorName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, currency, method, destination, creatorName }: PayoutEmailRequest = await req.json();

    const emailHtml = `
      <div style="background: linear-gradient(135deg, #ff7b42 0%, #8b5cf6 50%, #ff7b42 100%); padding: 40px 0; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ff7b42 0%, #8b5cf6 50%, #ff7b42 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              SkillPulse
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
              Payout Confirmation
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #ff7b42 0%, #8b5cf6 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 32px;">💰</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">Payout Request Confirmed!</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">Your withdrawal request has been processed successfully.</p>
            </div>

            <!-- Payout Details -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #8b5cf6;">
              <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Payout Details</h3>
              
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Amount:</span>
                  <span style="color: #059669; font-weight: bold; font-size: 18px;">${currency} ${amount.toFixed(2)}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Method:</span>
                  <span style="color: #1f2937; font-weight: 600;">${method === 'stripe' ? 'Stripe Connect' : 'Mobile Money'}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Destination:</span>
                  <span style="color: #1f2937; font-weight: 600;">${destination}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280; font-weight: 500;">Processing Time:</span>
                  <span style="color: #1f2937; font-weight: 600;">${method === 'stripe' ? '2-7 business days' : 'Within 24 hours'}</span>
                </div>
              </div>
            </div>

            <!-- What's Next -->
            <div style="background: linear-gradient(135deg, rgba(255, 123, 66, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">What happens next?</h3>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Your payout request is being processed</li>
                <li>You'll receive the funds in your ${method === 'stripe' ? 'bank account' : 'mobile money wallet'}</li>
                <li>We'll notify you once the transfer is complete</li>
                <li>You can track all payouts in your Creator Dashboard</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://skillpulse.io/creator/payments" style="background: linear-gradient(135deg, #ff7b42 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                View Payout History
              </a>
            </div>

            <!-- Personal Message -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
                Hi ${creatorName},<br>
                Thank you for being part of the SkillPulse creator community. Your contribution helps learners worldwide achieve their goals!
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 12px;">
              This email was sent to ${email}. If you have any questions, please contact our support team.
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 11px;">
              © 2024 SkillPulse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "SkillPulse <payouts@skillpulse.io>",
      to: [email],
      subject: `Payout Confirmation - ${currency} ${amount.toFixed(2)}`,
      html: emailHtml,
    });

    console.log("Payout confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in payout-confirmation-email function:", error);
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
