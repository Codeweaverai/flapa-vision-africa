
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check if authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: "Enrollment ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from("course_enrollments")
      .select(`
        id,
        user_id,
        course_id,
        courses:course_id (title)
      `)
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: "Enrollment not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify that the requesting user owns the enrollment
    if (enrollment.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user profile details
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    // Check if certificate already exists
    const { data: existingCert, error: certError } = await supabaseClient
      .from("certificates")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();

    if (certError) {
      console.error("Error checking existing certificate:", certError);
    }

    if (existingCert) {
      return new Response(
        JSON.stringify({ certificate: existingCert }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Check if course-materials bucket exists
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    if (!buckets?.find(b => b.name === "course-materials")) {
      // Create bucket with service role key
      await supabaseClient.storage.createBucket("course-materials", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      // Ensure public access to certificates folder
      await supabaseClient.storage.from("course-materials").createSignedUrl("certificates/dummy.txt", 60);
    }

    // Create certificate record
    const { data: certificate, error: createError } = await supabaseClient
      .from("certificates")
      .insert({
        enrollment_id: enrollmentId,
        verification_code: verificationCode,
        issue_date: new Date().toISOString(),
        pdf_url: `${supabaseUrl}/storage/v1/object/public/course-materials/certificates/${verificationCode}.pdf`
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating certificate:", createError);
      return new Response(
        JSON.stringify({ error: "Failed to create certificate" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Certificate generated successfully", 
        certificate 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in generate-certificate function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Helper function to generate a random verification code
function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
