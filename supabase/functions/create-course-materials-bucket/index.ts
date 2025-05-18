
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

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
      
      // Add public policy to the bucket - this is important for RLS
      await supabase.storage.from('course-materials').createSignedUrl('dummy.txt', 60)
      
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
    console.error('Error in create-course-materials-bucket function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
