
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

    const { message, userId } = await req.json();

    console.log('Creator AI Assistant request:', { message, userId });

    // Get creator context
    let creatorContext = '';
    if (userId) {
      // Get creator's courses and events
      const { data: courses } = await supabaseClient
        .from('courses')
        .select('title, category, description, is_published')
        .eq('creator_id', userId);

      const { data: events } = await supabaseClient
        .from('events')
        .select('title, event_type, description')
        .eq('creator_id', userId);

      creatorContext = `
Creator Profile:
- Published Courses: ${courses?.filter(c => c.is_published).length || 0}
- Draft Courses: ${courses?.filter(c => !c.is_published).length || 0}
- Course Categories: ${courses?.map(c => c.category).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'None'}
- Events Created: ${events?.length || 0}
- Event Types: ${events?.map(e => e.event_type).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'None'}
`;
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are a Creator AI Assistant specialized in helping educators and content creators build amazing courses and events. You are an expert in educational design, content creation, and best practices.

${creatorContext}

Your expertise includes:
- Course structure and curriculum design
- Lesson planning and module organization
- Content creation strategies and techniques
- Student engagement and interaction methods
- Assessment and quiz design
- Event planning and management
- Marketing and promotion strategies
- Best practices for online education
- Learning objectives and outcomes
- Multimedia content integration

Provide practical, actionable advice that helps creators build high-quality educational content. Be specific and include examples when helpful. Focus on proven educational methodologies and industry best practices.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpulse.app',
        'X-Title': 'SkillPulse Creator Assistant'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:nitro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500
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
    console.error('Error in creator-ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
