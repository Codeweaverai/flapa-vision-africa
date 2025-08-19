
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendGiftEmailRequest {
  giftId: string;
  type: 'course' | 'event';
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

    const { giftId, type }: SendGiftEmailRequest = await req.json();

    // Fetch gift details
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (giftError) throw giftError;

    // Fetch item details (course or event)
    let itemDetails = null;
    if (type === 'course') {
      const { data, error } = await supabase
        .from('courses')
        .select('title, description')
        .eq('id', gift.item_id)
        .single();
      
      if (error) throw error;
      itemDetails = data;
    } else if (type === 'event') {
      const { data, error } = await supabase
        .from('events')
        .select('title, description, start_time, location')
        .eq('id', gift.item_id)
        .single();
      
      if (error) throw error;
      itemDetails = data;
    }

    const claimUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/gift-redeem?code=${gift.gift_code}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; overflow: hidden;">
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0 0 20px 0; font-size: 28px;">🎁 You've Received a Gift!</h1>
          <p style="margin: 0 0 30px 0; font-size: 18px; opacity: 0.9;">
            ${gift.sender_name} has gifted you a ${type === 'course' ? 'course' : 'event ticket'}!
          </p>
        </div>
        
        <div style="background: white; color: #333; padding: 30px; margin: 0 20px 20px 20px; border-radius: 10px;">
          <h2 style="margin: 0 0 15px 0; color: #667eea;">${itemDetails?.title}</h2>
          
          ${type === 'event' ? `
            <p style="margin: 10px 0; color: #666;">
              📅 ${new Date(itemDetails?.start_time).toLocaleString()}<br>
              📍 ${itemDetails?.location}
            </p>
          ` : ''}
          
          ${gift.personal_message ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-style: italic;">"${gift.personal_message}"</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">- ${gift.sender_name}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${claimUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Claim Your Gift
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0 0 0;">
            Gift Code: <strong>${gift.gift_code}</strong><br>
            This gift expires on ${new Date(gift.expires_at).toLocaleDateString()}
          </p>
        </div>
        
        <div style="padding: 20px 30px; text-align: center; font-size: 14px; opacity: 0.8;">
          <p>Happy learning from the SkillPulse team! 🚀</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: 'SkillPulse <noreply@skillpulse.cloud>',
      to: [gift.recipient_email],
      subject: `🎁 You've been gifted ${type === 'course' ? 'a course' : 'an event ticket'}!`,
      html: emailHtml,
    });

    console.log('Gift email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error sending gift email:', error);
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
