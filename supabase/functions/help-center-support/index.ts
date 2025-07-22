
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

    // Get comprehensive user context
    const userContext = await getUserContext(supabase, userId);
    
    // Get help center data
    const helpCenterData = await getHelpCenterData(supabase);

    // Create contextual system prompt
    const systemPrompt = createSystemPrompt(userContext, helpCenterData);

    console.log('Help Center Support request:', { message, userId });

    // Call OpenRouter API with DeepSeek R1 model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpulse.app',
        'X-Title': 'SkillPulse Help Center Support'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status}`, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in help center support function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to get support response',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserContext(supabase: any, userId: string) {
  if (!userId) return null;

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, location, bio')
      .eq('id', userId)
      .single();

    // Get user's orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, total_amount, currency, payment_status, created_at,
        order_items (
          item_type, quantity, total_price,
          courses (title, category),
          events (title, event_type)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get course enrollments
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select(`
        enrollment_date, is_completed, payment_status,
        courses (title, category, difficulty_level)
      `)
      .eq('user_id', userId)
      .limit(10);

    // Get event bookings
    const { data: bookings } = await supabase
      .from('event_bookings')
      .select(`
        booking_date, status, payment_status,
        events (title, event_type, start_time)
      `)
      .eq('user_id', userId)
      .limit(10);

    return {
      profile,
      orders: orders || [],
      enrollments: enrollments || [],
      bookings: bookings || []
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

async function getHelpCenterData(supabase: any) {
  try {
    // Get FAQs
    const { data: faqs } = await supabase
      .from('help_center_faqs')
      .select('category, question, answer')
      .eq('is_published', true)
      .order('category')
      .order('order_index');

    // Get media posts for reference
    const { data: mediaPosts } = await supabase
      .from('media_posts')
      .select('title, summary, content, post_type, category')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      faqs: faqs || [],
      mediaPosts: mediaPosts || []
    };
  } catch (error) {
    console.error('Error getting help center data:', error);
    return { faqs: [], mediaPosts: [] };
  }
}

function createSystemPrompt(userContext: any, helpCenterData: any) {
  const userName = userContext?.profile?.full_name || userContext?.profile?.username || 'there';
  const userLocation = userContext?.profile?.location || '';
  
  // Format FAQs for context
  const faqContext = helpCenterData.faqs.map((faq: any) => 
    `Q: ${faq.question}\nA: ${faq.answer}\nCategory: ${faq.category}`
  ).join('\n\n');

  // Format user's recent activity
  const recentOrders = userContext?.orders?.slice(0, 3) || [];
  const recentEnrollments = userContext?.enrollments?.slice(0, 3) || [];
  const recentBookings = userContext?.bookings?.slice(0, 3) || [];

  return `You are the AI Help Center Support Assistant for SkillPulse, a comprehensive learning and events platform. You provide helpful, accurate, and contextual support to users based on their questions and platform data.

🔍 USER CONTEXT:
- Name: ${userName}
- Location: ${userLocation}
- Recent Orders: ${recentOrders.length}
- Course Enrollments: ${recentEnrollments.length}
- Event Bookings: ${recentBookings.length}

📚 PLATFORM KNOWLEDGE BASE:
${faqContext}

🎯 SUPPORT GUIDELINES:
1. **Be Helpful & Personal**: Address users by name when possible and reference their specific situation
2. **Use Platform Knowledge**: Draw from the FAQ database and media posts to provide accurate answers
3. **Order & Payment Support**: Help with order status, refunds, payment issues, and course access
4. **Learning Support**: Assist with course progress, certificates, technical issues, and platform navigation
5. **Event Support**: Help with event registrations, tickets, attendance, and event-specific questions
6. **Account Management**: Guide users through profile updates, password resets, and account settings

🛠️ RESPONSE STYLE:
- Keep responses concise but thorough (2-4 paragraphs max)
- Use a friendly, professional tone
- Provide specific steps when giving instructions
- Reference relevant FAQs or help articles when applicable
- If you cannot resolve an issue, direct users to contact our support team

🚨 IMPORTANT LIMITATIONS:
- Cannot process payments or refunds directly
- Cannot access private user data beyond what's provided
- Cannot modify user accounts or enrollments
- For urgent account issues, direct users to contact support directly

When users ask about specific issues, first check if there's a relevant FAQ, then provide personalized guidance based on their account activity and platform status.`;
}
