
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StripeTransferRequest {
  creatorId: string;
  amount: number;
  currency: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Timeout wrapper function
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creatorId, amount, currency }: StripeTransferRequest = await req.json();
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
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
        status: 400,
      });
    }

    // Create transfer record in database first
    const { data: transferRecord, error: transferError } = await supabaseClient
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

    if (transferError) {
      console.error('Error creating transfer record:', transferError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to create transfer record: ${transferError.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const transferAmount = Math.round(amount * 100); // Convert to cents

    console.log('Creating Stripe transfer for:', {
      amount: transferAmount,
      currency: currency.toLowerCase(),
      connectedAccountId: profile.stripe_connect_account_id
    });

    // Create Stripe transfer with timeout wrapper (5 seconds)
    let stripeResult;
    try {
      const stripeResponse = await withTimeout(
        fetch("https://api.stripe.com/v1/transfers", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            amount: transferAmount.toString(),
            currency: currency.toLowerCase(),
            destination: profile.stripe_connect_account_id,
            description: `Creator transfer for ${profile.full_name || profile.username}`,
            "metadata[creator_id]": creatorId,
            "metadata[transfer_record_id]": transferRecord.id
          }),
        }),
        5000 // 5 second timeout
      );

      stripeResult = await stripeResponse.json();
      console.log('Stripe transfer response:', stripeResult);

      if (!stripeResponse.ok) {
        console.error("Stripe transfer error:", stripeResult);
        
        // Update transfer record with error
        await supabaseClient
          .from('creator_payouts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transferRecord.id);
          
        return new Response(JSON.stringify({
          success: false,
          error: `Stripe transfer failed: ${stripeResult.error?.message || 'Unknown error'}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } catch (error) {
      console.error("Stripe transfer timeout or error:", error);
      
      // Update transfer record with error
      await supabaseClient
        .from('creator_payouts')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transferRecord.id);
        
      return new Response(JSON.stringify({
        success: false,
        error: 'Stripe transfer request timed out or failed'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Update the transfer record with Stripe transfer details
    const { error: updateError } = await supabaseClient
      .from('creator_payouts')
      .update({
        stripe_payout_id: stripeResult.id, // Store transfer ID in payout_id field
        status: 'completed',
        provider_payout_id: stripeResult.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferRecord.id);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    // Send confirmation email using Resend with timeout wrapper
    try {
      await withTimeout(
        resend.emails.send({
          from: "SkillPulse <onboarding@resend.dev>",
          to: creatorUser.email,
          subject: "Transfer Request Confirmed - SkillPulse",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Transfer Confirmed</h1>
              
              <p>Hello ${profile.full_name || profile.username || 'Creator'},</p>
              
              <p>Your transfer request has been confirmed and processed successfully!</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Transfer Details:</h3>
                <p><strong>Amount:</strong> $${amount.toFixed(2)} USD</p>
                <p><strong>Method:</strong> Stripe Transfer</p>
                <p><strong>Destination:</strong> Connected Stripe Account</p>
                <p><strong>Transfer ID:</strong> ${transferRecord.id}</p>
                <p><strong>Stripe Transfer ID:</strong> ${stripeResult.id}</p>
                <p><strong>Status:</strong> Completed</p>
              </div>
              
              <p>Your funds have been transferred to your connected Stripe account and should be available immediately.</p>
              
              <p>Thank you for being a valued creator on SkillPulse!</p>
              
              <p>Best regards,<br>The SkillPulse Team</p>
            </div>
          `,
        }),
        3000 // 3 second timeout for email
      );

      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the transfer if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      transferId: transferRecord.id,
      stripeTransferId: stripeResult.id,
      status: 'completed',
      message: 'Transfer created successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Stripe transfer error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to process transfer"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
