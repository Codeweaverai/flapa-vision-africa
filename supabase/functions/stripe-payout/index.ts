
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StripePayoutRequest {
  creatorId: string;
  amount: number;
  currency: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Timeout wrapper for fetch calls
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creatorId, amount, currency }: StripePayoutRequest = await req.json();
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({
        success: false,
        error: "Stripe secret key not configured"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Create Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get creator's Stripe Connect account ID and profile info
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_connect_account_id, full_name, username')
      .eq('id', creatorId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Creator profile not found'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (!profile.stripe_connect_account_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Creator does not have a connected Stripe account'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get creator's email from auth
    const { data: { user: creatorUser }, error: creatorUserError } = await supabaseClient.auth.admin.getUserById(creatorId);
    
    if (creatorUserError || !creatorUser?.email) {
      console.error('Error getting creator user email:', creatorUserError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Creator email not found'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Create payout record in database first
    const { data: payoutRecord, error: payoutError } = await supabaseClient
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount: amount,
        currency: currency.toLowerCase(),
        method: 'stripe',
        payout_method: 'stripe',
        destination: 'Stripe Connected Account',
        status: 'pending'
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout record:', payoutError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to create payout record: ${payoutError.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const requestedAmount = Math.round(amount * 100); // Convert to cents

    console.log('Creating Stripe payout for:', {
      amount: requestedAmount,
      currency: currency.toLowerCase(),
      connectedAccountId: profile.stripe_connect_account_id
    });

    // Create Stripe payout with timeout protection
    let stripeResult;
    try {
      const stripeResponse = await fetchWithTimeout("https://api.stripe.com/v1/payouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Stripe-Account": profile.stripe_connect_account_id,
        },
        body: new URLSearchParams({
          amount: requestedAmount.toString(),
          currency: currency.toLowerCase(),
          description: `Creator payout for ${profile.full_name || profile.username}`,
          statement_descriptor: "Creator Payout",
          method: "instant", // Request instant payout if available
          "metadata[creator_id]": creatorId,
          "metadata[payout_record_id]": payoutRecord.id
        }),
      }, 5000); // 5 second timeout

      stripeResult = await stripeResponse.json();
      console.log('Stripe payout response:', stripeResult);

      if (!stripeResponse.ok) {
        console.error("Stripe payout error:", stripeResult);
        
        // Update payout record with error
        await supabaseClient
          .from('creator_payouts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payoutRecord.id);
          
        return new Response(JSON.stringify({
          success: false,
          error: `Stripe payout failed: ${stripeResult.error?.message || 'Unknown error'}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } catch (error) {
      console.error("Stripe payout timeout or error:", error);
      
      // Update payout record with error
      await supabaseClient
        .from('creator_payouts')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutRecord.id);
        
      return new Response(JSON.stringify({
        success: false,
        error: 'Payout request timed out or failed'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Update the payout record with Stripe payout details
    const payoutStatus = stripeResult.status === 'paid' ? 'completed' : 
                        stripeResult.status === 'pending' ? 'processing' : 
                        stripeResult.status === 'in_transit' ? 'processing' : 'completed';

    const { error: updateError } = await supabaseClient
      .from('creator_payouts')
      .update({
        stripe_payout_id: stripeResult.id,
        status: payoutStatus,
        provider_payout_id: stripeResult.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutRecord.id);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // Send confirmation email with timeout protection
    try {
      const emailPromise = resend.emails.send({
        from: "SkillPulse <onboarding@resend.dev>",
        to: creatorUser.email,
        subject: "Payout Request Confirmed - SkillPulse",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Payout Confirmed</h1>
            
            <p>Hello ${profile.full_name || profile.username || 'Creator'},</p>
            
            <p>Your payout request has been confirmed and is being processed!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Payout Details:</h3>
              <p><strong>Amount:</strong> $${amount.toFixed(2)} USD</p>
              <p><strong>Method:</strong> Stripe Connect</p>
              <p><strong>Destination:</strong> Connected Bank Account</p>
              <p><strong>Payout ID:</strong> ${payoutRecord.id}</p>
              <p><strong>Stripe Payout ID:</strong> ${stripeResult.id}</p>
              <p><strong>Status:</strong> ${payoutStatus === 'completed' ? 'Completed' : 'Processing'}</p>
              ${stripeResult.arrival_date ? `<p><strong>Expected Arrival:</strong> ${new Date(stripeResult.arrival_date * 1000).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>Your funds will be transferred to your connected bank account. Processing typically takes 2-7 business days.</p>
            
            <p>Thank you for being a valued creator on SkillPulse!</p>
            
            <p>Best regards,<br>The SkillPulse Team</p>
          </div>
        `,
      });

      // Set a timeout for email sending
      const emailTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 3000)
      );

      await Promise.race([emailPromise, emailTimeout]);
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the payout if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      payoutId: payoutRecord.id,
      stripePayoutId: stripeResult.id,
      status: stripeResult.status,
      arrivalDate: stripeResult.arrival_date,
      message: 'Payout created successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Stripe payout error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to process payout"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
