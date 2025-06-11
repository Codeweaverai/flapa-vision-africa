
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

    // Verify certificate
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        issue_date,
        verification_code,
        course_enrollments:enrollment_id (
          courses:course_id (title),
          profiles:user_id (full_name)
        )
      `)
      .eq('verification_code', verificationCode)
      .single()
    
    console.log('Database query result:', { data, error })
    
    if (error || !data) {
      console.log('Certificate not found:', error)
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
    
    // Format the response
    const response = {
      valid: true,
      details: {
        studentName: data.course_enrollments?.profiles?.full_name || 'Student',
        courseName: data.course_enrollments?.courses?.title || 'Course',
        issueDate: data.issue_date ? new Date(data.issue_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        verificationCode: verificationCode
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
