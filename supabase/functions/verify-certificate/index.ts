
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
    let verificationCode: string | null = null;

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url)
      verificationCode = url.searchParams.get('code')
    } else if (req.method === 'POST') {
      const body = await req.json()
      verificationCode = body.code
    }

    console.log('Verification code received:', verificationCode)

    if (!verificationCode) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Verification code is required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Server configuration error' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, get the certificate with the verification code
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('verification_code', verificationCode)
      .single()
    
    console.log('Certificate query result:', { certificate, certError })
    
    if (certError || !certificate) {
      console.log('Certificate not found:', certError)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Certificate not found or invalid' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('id', certificate.enrollment_id)
      .single()

    if (enrollmentError) {
      console.log('Enrollment not found:', enrollmentError)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Associated enrollment not found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title')
      .eq('id', certificate.course_id || enrollment.course_id)
      .single()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', certificate.user_id || enrollment.user_id)
      .single()
    
    // Format the response with available data
    const response = {
      valid: true,
      details: {
        studentName: profile?.full_name || 'Student',
        courseName: course?.title || 'Course',
        issueDate: certificate.issue_date ? new Date(certificate.issue_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        verificationCode: verificationCode,
        certificateId: certificate.id
      }
    }

    console.log('Returning response:', response)
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in verify-certificate function:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
