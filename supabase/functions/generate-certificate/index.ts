
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get request body
    const { enrollmentId } = await req.json()

    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: 'Enrollment ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if certificate already exists
    const { data: existingCert, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle()
    
    if (certError) {
      throw new Error(`Error checking existing certificate: ${certError.message}`)
    }
    
    if (existingCert) {
      return new Response(
        JSON.stringify({ certificate: existingCert }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get enrollment details with user and course information
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        courses:course_id (title),
        profiles:user_id (full_name)
      `)
      .eq('id', enrollmentId)
      .single()
    
    if (enrollmentError || !enrollment) {
      throw new Error(`Error fetching enrollment details: ${enrollmentError?.message || 'Enrollment not found'}`)
    }

    // Generate unique verification code (8 chars alphanumeric)
    const verificationCode = generateVerificationCode()

    // Create certificate record
    const { data: certificate, error: createError } = await supabase
      .from('certificates')
      .insert({
        enrollment_id: enrollmentId,
        verification_code: verificationCode,
        issue_date: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      throw new Error(`Error creating certificate: ${createError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        certificate,
        studentName: enrollment.profiles.full_name,
        courseName: enrollment.courses.title 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to generate a random verification code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
