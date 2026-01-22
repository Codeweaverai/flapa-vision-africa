import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptionSegment {
  start_time: number;
  end_time: number;
  text: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId, videoUrl } = await req.json();
    
    if (!lessonId || !videoUrl) {
      throw new Error('Missing required parameters: lessonId and videoUrl');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting transcription for lesson:', lessonId);

    // 1. Download the video file
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBuffer = await response.arrayBuffer();
    const videoFile = new File([videoBuffer], 'video.mp4', { type: 'video/mp4' });

    // 2. Transcribe with OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcription = await transcriptionResponse.json();

    // 3. Process and insert segments into database
    if (transcription.segments && transcription.segments.length > 0) {
      const segments = transcription.segments.map((segment: any) => ({
        lesson_id: lessonId,
        start_time: segment.start,
        end_time: segment.end,
        text: segment.text.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert in batches to avoid hitting limits
      const batchSize = 100;
      for (let i = 0; i < segments.length; i += batchSize) {
        const batch = segments.slice(i, i + batchSize);
        const { error: insertError } = await supabaseClient
          .from('lesson_transcripts')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting batch:', insertError);
        }
      }

      console.log(`Inserted ${segments.length} transcript segments for lesson ${lessonId}`);

      // Update lesson to mark transcription as complete
      const { error: updateError } = await supabaseClient
        .from('lessons')
        .update({ 
          transcription_status: 'completed',
          transcription_updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Error updating lesson:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transcription completed successfully',
        segmentCount: transcription.segments?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});