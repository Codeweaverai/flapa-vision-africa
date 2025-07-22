
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { message, courseId, courseName, userId } = await req.json();

    console.log('Learning AI Assistant request:', { message, courseId, courseName, userId });

    // Get user context
    let userContext = '';
    if (userId) {
      // Get user's enrolled courses
      const { data: enrollments } = await supabaseClient
        .from('course_enrollments')
        .select(`
          course_id,
          courses (
            title,
            description,
            category
          )
        `)
        .eq('user_id', userId);

      // Get course modules and lessons if courseId is provided
      let courseContext = '';
      if (courseId) {
        const { data: modules } = await supabaseClient
          .from('course_modules')
          .select(`
            title,
            description,
            lessons (
              title,
              description,
              content_type,
              lesson_transcripts (
                content
              )
            )
          `)
          .eq('course_id', courseId);

        if (modules) {
          courseContext = `
Current Course Context:
${modules.map(module => `
Module: ${module.title}
${module.description || ''}
Lessons: ${module.lessons?.map(lesson => `
- ${lesson.title}: ${lesson.description || ''}
${lesson.lesson_transcripts?.map(transcript => `Transcript: ${transcript.content}`).join('\n') || ''}
`).join('\n')}
`).join('\n')}`;
        }
      }

      userContext = `
User Learning Context:
- Enrolled Courses: ${enrollments?.map(e => e.courses?.title).join(', ') || 'None'}
${courseContext}
`;
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are a Learning AI Assistant specialized in helping students with their educational journey. You have access to course content, lesson transcripts, and learning materials.

${userContext}

Your role:
- Help students understand course concepts and materials
- Explain complex topics in simple terms
- Provide study guidance and learning strategies
- Answer questions about specific lessons and modules
- Suggest practice exercises and review materials
- Encourage continued learning and progress

Be helpful, encouraging, and educational. Always relate your answers to the student's current courses and learning progress when possible.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpulse.app',
        'X-Title': 'SkillPulse Learning Assistant'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:nitro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

    console.log('AI Response generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      response: aiResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in learning-ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
