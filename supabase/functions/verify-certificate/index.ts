
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
    // Get verification code from request
    const url = new URL(req.url)
    const verificationCode = url.searchParams.get('code')

    if (!verificationCode) {
      return new Response(
        JSON.stringify({ error: 'Verification code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify certificate
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        issue_date,
        course_enrollments:enrollment_id (
          courses:course_id (title),
          profiles:user_id (full_name)
        )
      `)
      .eq('verification_code', verificationCode)
      .single()
    
    if (error || !data) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Certificate not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    return new Response(
      JSON.stringify({
        valid: true,
        details: {
          studentName: data.course_enrollments?.profiles?.full_name || 'Student',
          courseName: data.course_enrollments?.courses?.title || 'Course',
          issueDate: data.issue_date ? new Date(data.issue_date).toLocaleDateString() : 'Unknown',
          verificationCode: verificationCode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
