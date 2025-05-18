
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Allow requests from any origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
    'Content-Type': 'application/json',
  }

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Error listing buckets: ${listError.message}`)
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'course-materials')
    
    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('course-materials', {
        public: true,
        fileSizeLimit: 10485760, // 10MB file size limit
      })
      
      if (createError) {
        throw new Error(`Error creating bucket: ${createError.message}`)
      }
      
      // Add public policy to the bucket
      const { error: policyError } = await supabase.storage.from('course-materials').getPublicUrl('test.txt')
      
      if (policyError) {
        console.warn(`Note: Public policy may need to be set manually: ${policyError.message}`)
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Created course-materials bucket' }),
        { headers: corsHeaders, status: 200 }
      )
    } else {
      return new Response(
        JSON.stringify({ success: true, message: 'course-materials bucket already exists' }),
        { headers: corsHeaders, status: 200 }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
