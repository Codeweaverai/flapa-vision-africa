
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendGiftCardEmailRequest {
  giftCardId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { giftCardId }: SendGiftCardEmailRequest = await req.json();

    // Fetch gift card details
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', giftCardId)
      .single();

    if (giftCardError) throw giftCardError;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 10px; overflow: hidden;">
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0 0 20px 0; font-size: 28px;">🎁 Gift Card for You!</h1>
          <p style="margin: 0 0 30px 0; font-size: 18px; opacity: 0.9;">
            ${giftCard.sender_name} has sent you a SkillPulse gift card!
          </p>
        </div>
        
        <div style="background: white; color: #333; padding: 30px; margin: 0 20px 20px 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; display: inline-block; min-width: 200px;">
              <h2 style="margin: 0 0 10px 0; font-size: 32px;">$${giftCard.amount}</h2>
              <p style="margin: 0; opacity: 0.9;">Gift Card Value</p>
            </div>
          </div>
          
          ${giftCard.personal_message ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f093fb;">
              <p style="margin: 0; font-style: italic;">"${giftCard.personal_message}"</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">- ${giftCard.sender_name}</p>
            </div>
          ` : ''}
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">How to Use Your Gift Card:</h3>
            <ol style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Browse our courses and events</li>
              <li>Add items to your cart</li>
              <li>At checkout, enter this code in the promo code field</li>
              <li>Enjoy your learning journey!</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Your Gift Card Code:</p>
            <p style="margin: 0; font-size: 24px; font-family: monospace; background: white; padding: 15px; border-radius: 8px; border: 2px dashed #f093fb; color: #f093fb; font-weight: bold;">
              ${giftCard.gift_card_code}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/courses" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Start Shopping
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0 0 0;">
            This gift card expires on ${new Date(giftCard.expires_at).toLocaleDateString()}<br>
            Currency: ${giftCard.currency}
          </p>
        </div>
        
        <div style="padding: 20px 30px; text-align: center; font-size: 14px; opacity: 0.8;">
          <p>Happy learning from the SkillPulse team! 🚀</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: 'SkillPulse <noreply@skillpulse.cloud>',
      to: [giftCard.recipient_email],
      subject: `🎁 You've received a $${giftCard.amount} SkillPulse Gift Card!`,
      html: emailHtml,
    });

    console.log('Gift card email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error sending gift card email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
