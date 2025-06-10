
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, lessonTitle, lessonContent, courseId, lessonId, userId } = await req.json();

    console.log('AI Assistant request:', { message, lessonTitle, courseId, lessonId, userId });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get additional course context
    let courseContext = '';
    if (courseId) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title, description, category, difficulty_level')
        .eq('id', courseId)
        .single();

      if (courseData) {
        courseContext = `Course: ${courseData.title}\nCategory: ${courseData.category}\nDifficulty: ${courseData.difficulty_level}\nDescription: ${courseData.description}`;
      }
    }

    // Get lesson context if lesson ID is provided
    let lessonContext = '';
    if (lessonId) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('title, description, content')
        .eq('id', lessonId)
        .single();

      if (lessonData) {
        lessonContext = `\nLesson Details:\nTitle: ${lessonData.title}\nDescription: ${lessonData.description || 'No description available'}`;
        if (lessonData.content && typeof lessonData.content === 'object') {
          lessonContext += `\nContent: ${JSON.stringify(lessonData.content)}`;
        }
      }
    }

    // Get recent chat history for context (last 10 messages)
    let chatContext = '';
    if (userId && (lessonId || courseId)) {
      let historyQuery = supabase
        .from('ai_chat_history')
        .select('message_type, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (lessonId) {
        historyQuery = historyQuery.eq('lesson_id', lessonId);
      } else if (courseId) {
        historyQuery = historyQuery.eq('course_id', courseId);
      }

      const { data: chatHistory } = await historyQuery;
      
      if (chatHistory && chatHistory.length > 0) {
        const recentMessages = chatHistory.reverse().slice(-5); // Get last 5 messages for context
        chatContext = '\n\nRecent conversation:\n' + 
          recentMessages.map(msg => `${msg.message_type}: ${msg.content}`).join('\n');
      }
    }

    // Create system prompt with platform context
    const systemPrompt = `You are an AI learning assistant for a comprehensive learning platform. You help students understand course content and answer questions related to their learning journey.

Context about the current lesson:
${lessonTitle ? `Lesson Title: ${lessonTitle}` : ''}
${lessonContent ? `Lesson Content: ${lessonContent}` : ''}
${lessonContext}

${courseContext}

${chatContext}

Your role:
- Help students understand the lesson content
- Provide clear explanations and examples
- Break down complex concepts into simple terms
- Suggest practical applications
- Encourage learning and engagement
- Stay focused on educational content
- Reference previous parts of our conversation when relevant

Guidelines:
- Be encouraging and supportive
- Provide specific, actionable answers
- Use examples when helpful
- Keep responses concise but informative
- If you don't know something about the specific lesson, say so
- Always relate your answers back to the learning objectives
- Build upon previous conversation context when appropriate`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI assistant function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get AI response',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
