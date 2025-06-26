
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context from database
    const userContext = await getUserContext(supabase, userId);
    
    // Get course and event recommendations
    const recommendations = await getRecommendations(supabase, userContext);

    // Create contextual system prompt
    const systemPrompt = createSystemPrompt(userContext, recommendations);

    console.log('Smart Advisor request:', { message, userId, userContext });

    // Call OpenRouter API with DeepSeek model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpulse.app',
        'X-Title': 'SkillPulse Smart Advisor'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status}`, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Extract IDs from the response for frontend actions
    const actionIds = extractActionIds(aiResponse);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      actionIds,
      userContext,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart advisor function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to get advisor response',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserContext(supabase: any, userId: string) {
  if (!userId) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, location, bio')
    .eq('id', userId)
    .single();

  // Get completed courses
  const { data: completedCourses } = await supabase
    .from('course_enrollments')
    .select(`
      courses (id, title, category, difficulty_level, price)
    `)
    .eq('user_id', userId)
    .eq('is_completed', true)
    .limit(5);

  // Get courses in progress
  const { data: inProgressCourses } = await supabase
    .from('course_enrollments')
    .select(`
      courses (id, title, category, difficulty_level, price)
    `)
    .eq('user_id', userId)
    .eq('is_completed', false)
    .limit(5);

  // Get cart items
  const { data: cartItems } = await supabase
    .from('carts')
    .select('item_id, item_type, price')
    .eq('user_id', userId);

  // Get event bookings
  const { data: eventBookings } = await supabase
    .from('event_bookings')
    .select(`
      events (id, title, event_type, price, start_time)
    `)
    .eq('user_id', userId)
    .limit(5);

  return {
    profile,
    completedCourses: completedCourses || [],
    inProgressCourses: inProgressCourses || [],
    cartItems: cartItems || [],
    eventBookings: eventBookings || []
  };
}

async function getRecommendations(supabase: any, userContext: any) {
  // Get trending courses
  const { data: trendingCourses } = await supabase
    .from('courses')
    .select('id, title, category, difficulty_level, price, creator_id')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, event_type, price, start_time, location')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(10);

  // Get popular categories based on user's completed courses
  const userCategories = userContext?.completedCourses?.map((c: any) => c.courses?.category).filter(Boolean) || [];
  
  return {
    trendingCourses: trendingCourses || [],
    upcomingEvents: upcomingEvents || [],
    userCategories
  };
}

function createSystemPrompt(userContext: any, recommendations: any) {
  const userName = userContext?.profile?.full_name || userContext?.profile?.username || 'there';
  const userLocation = userContext?.profile?.location || '';
  const completedCourses = userContext?.completedCourses?.length || 0;
  const inProgressCourses = userContext?.inProgressCourses?.length || 0;
  const cartItemsCount = userContext?.cartItems?.length || 0;

  return `You are the AI Smart Advisor for SkillPulse — an AI-powered learning and events platform for Africa.

🎯 USER CONTEXT:
- Name: ${userName}
- Location: ${userLocation}
- Completed Courses: ${completedCourses}
- Courses in Progress: ${inProgressCourses}
- Items in Cart: ${cartItemsCount}

🎓 AVAILABLE COURSES:
${recommendations.trendingCourses.map((c: any) => `- ${c.title} (${c.category}, $${c.price})`).join('\n')}

🎪 UPCOMING EVENTS:
${recommendations.upcomingEvents.map((e: any) => `- ${e.title} (${e.event_type}, $${e.price || 'Free'})`).join('\n')}

🧠 YOUR ROLE:
Guide users in choosing:
- Online courses
- Live events  
- Certification tracks
- Learning bundles

🌍 REGIONAL CUSTOMIZATION:
${userLocation.includes('Zambia') || userLocation.includes('Kenya') ? 'Prioritize local African content and mention mobile money payment options.' : 'Adapt recommendations based on user location.'}

💡 RESPONSE FORMAT:
Always suggest:
1. 1 personalized course with [COURSE_ID:xxx]
2. 1 relevant live event with [EVENT_ID:xxx] 
3. 1 curated bundle or next step

Include engaging language like:
- "Unlock this full path for just $5"
- "Get certified in 7 days"
- "Only 3 seats left"

🔒 Keep replies under 200 words, be friendly, motivating, and helpful.`;
}

function extractActionIds(response: string) {
  const courseIdMatch = response.match(/\[COURSE_ID:(\w+)\]/);
  const eventIdMatch = response.match(/\[EVENT_ID:(\w+)\]/);
  const bundleIdMatch = response.match(/\[BUNDLE_ID:(\w+)\]/);

  return {
    courseId: courseIdMatch ? courseIdMatch[1] : null,
    eventId: eventIdMatch ? eventIdMatch[1] : null,
    bundleId: bundleIdMatch ? bundleIdMatch[1] : null
  };
}
