
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  filename: string;
  contentType: string;
  fileType: 'video' | 'material';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get the user's JWT token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { filename, contentType, fileType }: UploadRequest = await req.json()

    if (!filename || !contentType || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: filename, contentType, fileType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Wasabi configuration from environment
    const wasabiAccessKey = Deno.env.get('WASABI_ACCESS_KEY')
    const wasabiSecretKey = Deno.env.get('WASABI_SECRET_KEY')
    const wasabiBucket = Deno.env.get('WASABI_BUCKET_NAME')
    const wasabiRegion = Deno.env.get('WASABI_REGION')
    const wasabiEndpoint = Deno.env.get('WASABI_ENDPOINT')

    if (!wasabiAccessKey || !wasabiSecretKey || !wasabiBucket || !wasabiRegion || !wasabiEndpoint) {
      console.error('Missing Wasabi configuration')
      return new Response(
        JSON.stringify({ error: 'Storage configuration not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const prefix = fileType === 'video' ? 'course-videos' : 'course-materials'
    const key = `${prefix}/${timestamp}-${sanitizedFilename}`

    // Generate presigned URL for Wasabi (simplified approach for this implementation)
    // In production, you'd use AWS SDK or similar to generate proper presigned URLs
    const uploadUrl = `${wasabiEndpoint}/${wasabiBucket}/${key}`
    const publicUrl = uploadUrl

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
        publicUrl,
        key,
        bucket: wasabiBucket
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating upload URL:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
