
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateGiftCardRequest {
  giftCardCode: string;
  orderAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { giftCardCode, orderAmount }: ValidateGiftCardRequest = await req.json();

    // Fetch gift card details
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('gift_card_code', giftCardCode.toUpperCase())
      .single();

    if (giftCardError || !giftCard) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid gift card code'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if gift card is valid
    if (giftCard.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        message: 'This gift card has been used or expired'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (new Date(giftCard.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        message: 'This gift card has expired'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const remainingBalance = giftCard.amount - giftCard.used_amount;
    
    if (remainingBalance <= 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'This gift card has been fully used'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Calculate discount amount (can't exceed order amount or remaining balance)
    const discountAmount = Math.min(orderAmount, remainingBalance);

    return new Response(JSON.stringify({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.gift_card_code,
        amount: giftCard.amount,
        used_amount: giftCard.used_amount,
        remaining_balance: remainingBalance,
        currency: giftCard.currency
      },
      discount_amount: discountAmount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error validating gift card:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
