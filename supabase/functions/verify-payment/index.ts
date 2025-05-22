
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("No session ID provided");
    }
    
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseClient = createClient(supabaseUrl || "", supabaseServiceKey || "");
    
    const metadata = session.metadata || {};
    const paymentStatus = session.payment_status;
    const userId = metadata.userId;
    
    if (!userId) {
      throw new Error("No user ID found in session metadata");
    }
    
    let result;
    
    // Handle different item types
    if (metadata.itemType === "course") {
      const courseId = metadata.course_id;
      
      if (!courseId) {
        throw new Error("No course ID found in session metadata");
      }
      
      // Update course enrollment or create if it doesn't exist
      const { data: existingEnrollment, error: enrollmentCheckError } = await supabaseClient
        .from("course_enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();
      
      if (enrollmentCheckError) {
        throw new Error(`Error checking enrollment: ${enrollmentCheckError.message}`);
      }
      
      if (existingEnrollment) {
        // Update existing enrollment
        const { data: enrollment, error: updateError } = await supabaseClient
          .from("course_enrollments")
          .update({
            payment_status: paymentStatus === "paid" ? "paid" : "pending",
            payment_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingEnrollment.id)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Error updating enrollment: ${updateError.message}`);
        }
        
        result = { success: true, enrollment };
      } else {
        // Create new enrollment
        const { data: enrollment, error: insertError } = await supabaseClient
          .from("course_enrollments")
          .insert({
            user_id: userId,
            course_id: courseId,
            payment_status: paymentStatus === "paid" ? "paid" : "pending",
            payment_id: session.id,
            enrollment_date: new Date().toISOString(),
            is_completed: false,
          })
          .select()
          .single();
        
        if (insertError) {
          throw new Error(`Error creating enrollment: ${insertError.message}`);
        }
        
        result = { success: true, enrollment };
      }
    } else if (metadata.itemType === "event") {
      const eventId = metadata.event_id;
      
      if (!eventId) {
        throw new Error("No event ID found in session metadata");
      }
      
      // Update registration or create if it doesn't exist
      const { data: existingRegistration, error: registrationCheckError } = await supabaseClient
        .from("registrations")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .maybeSingle();
      
      if (registrationCheckError) {
        throw new Error(`Error checking registration: ${registrationCheckError.message}`);
      }
      
      if (existingRegistration) {
        // Update existing registration
        const { data: registration, error: updateError } = await supabaseClient
          .from("registrations")
          .update({
            payment_status: paymentStatus === "paid" ? "paid" : "pending",
            status: paymentStatus === "paid" ? "confirmed" : existingRegistration.status,
            payment_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRegistration.id)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Error updating registration: ${updateError.message}`);
        }
        
        result = { success: true, registration };
      } else {
        // Create new registration
        const { data: registration, error: insertError } = await supabaseClient
          .from("registrations")
          .insert({
            user_id: userId,
            event_id: eventId,
            payment_status: paymentStatus === "paid" ? "paid" : "pending",
            status: paymentStatus === "paid" ? "confirmed" : "pending",
            payment_id: session.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (insertError) {
          throw new Error(`Error creating registration: ${insertError.message}`);
        }
        
        result = { success: true, registration };
      }
    } else {
      throw new Error("Invalid item type");
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        payment_status: paymentStatus,
        session_id: session.id,
        result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
