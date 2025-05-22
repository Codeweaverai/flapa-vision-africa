
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

    // Get the request body
    const { itemType, itemId, userId } = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseClient = createClient(supabaseUrl || "", supabaseServiceKey || "");

    let lineItems = [];
    let successRedirect = "";
    let metadata = {};

    if (itemType === "course") {
      // Fetch course details
      const { data: course, error: courseError } = await supabaseClient
        .from("courses")
        .select("*")
        .eq("id", itemId)
        .single();

      if (courseError) {
        throw new Error(`Error fetching course: ${courseError.message}`);
      }

      if (!course) {
        throw new Error("Course not found");
      }

      // Check if user is already enrolled
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from("course_enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", itemId)
        .maybeSingle();

      if (enrollmentError) {
        throw new Error(`Error checking enrollment: ${enrollmentError.message}`);
      }

      // If already enrolled and paid, don't proceed
      if (enrollment && enrollment.payment_status === "paid") {
        throw new Error("User already enrolled in this course");
      }

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
              description: course.description,
              images: course.thumbnail_url ? [course.thumbnail_url] : [],
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];

      metadata = {
        course_id: course.id,
        itemType: "course",
        userId,
      };

      successRedirect = `/payment/success?type=course&id=${course.id}`;
    } else if (itemType === "event") {
      // Fetch event details
      const { data: event, error: eventError } = await supabaseClient
        .from("events")
        .select("*")
        .eq("id", itemId)
        .single();

      if (eventError) {
        throw new Error(`Error fetching event: ${eventError.message}`);
      }

      if (!event) {
        throw new Error("Event not found");
      }

      // Check if user is already registered
      const { data: registration, error: registrationError } = await supabaseClient
        .from("registrations")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", itemId)
        .maybeSingle();

      if (registrationError) {
        throw new Error(`Error checking registration: ${registrationError.message}`);
      }

      // If already registered and paid, don't proceed
      if (registration && registration.payment_status === "paid") {
        throw new Error("User already registered for this event");
      }

      lineItems = [
        {
          price_data: {
            currency: event.currency?.toLowerCase() || "usd",
            product_data: {
              name: event.title,
              description: event.description,
              images: event.image_url ? [event.image_url] : [],
            },
            unit_amount: Math.round((event.price || 0) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];

      metadata = {
        event_id: event.id,
        itemType: "event",
        userId,
      };

      successRedirect = `/payment/success?type=event&id=${event.id}`;
    } else {
      throw new Error("Invalid item type");
    }

    // Get the user's email for customer information
    const { data: userData, error: userError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user data: ${userError.message}`);
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}${successRedirect}`,
      cancel_url: `${req.headers.get("origin")}/payment/cancel`,
      customer_email: userData?.email || undefined,
      metadata: metadata,
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);

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
