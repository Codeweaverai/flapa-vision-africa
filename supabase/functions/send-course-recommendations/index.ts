import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseRecommendationRequest {
  userId?: string; // If not provided, send to all users
  maxRecommendations?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, maxRecommendations = 3 }: CourseRecommendationRequest = await req.json();

    console.log(`Processing course recommendations for ${userId || 'all users'}`);

    // Get target users
    let targetUsers: any[] = [];
    
    if (userId) {
      const { data: user } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', userId)
        .single();
      if (user) targetUsers = [user];
    } else {
      // Get all users with course recommendation preferences enabled
      const { data: users } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          notification_preferences!inner (
            course_recommendations_enabled
          )
        `)
        .eq('notification_preferences.course_recommendations_enabled', true);
      
      targetUsers = users || [];
    }

    console.log(`Found ${targetUsers.length} users to send recommendations to`);

    let recommendationsSent = 0;
    let recommendationsSkipped = 0;

    for (const user of targetUsers) {
      try {
        // Get user's enrolled courses and categories
        const { data: enrolledCourses } = await supabase
          .from('course_enrollments')
          .select(`
            courses (
              id,
              category,
              tags
            )
          `)
          .eq('user_id', user.id)
          .eq('payment_status', 'completed');

        // Extract categories and tags from enrolled courses
        const enrolledCategories = new Set();
        const enrolledTags = new Set();
        const enrolledCourseIds = new Set();

        enrolledCourses?.forEach(enrollment => {
          if (enrollment.courses) {
            enrolledCourseIds.add(enrollment.courses.id);
            if (enrollment.courses.category) {
              enrolledCategories.add(enrollment.courses.category);
            }
            if (enrollment.courses.tags) {
              enrollment.courses.tags.forEach((tag: string) => enrolledTags.add(tag));
            }
          }
        });

        // Find recommended courses based on user's interests
        let recommendedCourses: any[] = [];

        // First, try to find courses in same categories
        if (enrolledCategories.size > 0) {
          const { data: categoryCourses } = await supabase
            .from('courses')
            .select('id, title, category, price, thumbnail_url, creator_id, profiles:creator_id(full_name)')
            .in('category', Array.from(enrolledCategories))
            .eq('is_published', true)
            .not('id', 'in', `(${Array.from(enrolledCourseIds).join(',')})`)
            .limit(maxRecommendations);

          recommendedCourses = categoryCourses || [];
        }

        // If not enough courses from categories, get popular courses
        if (recommendedCourses.length < maxRecommendations) {
          const { data: popularCourses } = await supabase
            .from('courses')
            .select(`
              id, title, category, price, thumbnail_url, creator_id,
              profiles:creator_id(full_name),
              course_enrollments(id)
            `)
            .eq('is_published', true)
            .not('id', 'in', `(${Array.from(enrolledCourseIds).join(',')})`)
            .limit(maxRecommendations * 2);

          // Sort by enrollment count and take remaining slots
          const sortedPopular = (popularCourses || [])
            .sort((a, b) => (b.course_enrollments?.length || 0) - (a.course_enrollments?.length || 0))
            .slice(0, maxRecommendations - recommendedCourses.length);

          recommendedCourses = [...recommendedCourses, ...sortedPopular];
        }

        if (recommendedCourses.length === 0) {
          console.log(`No recommendations found for user ${user.id}`);
          recommendationsSkipped++;
          continue;
        }

        // Create course recommendation content
        const courseList = recommendedCourses
          .map(course => `• ${course.title} by ${course.profiles?.full_name || 'Unknown'} - $${course.price || 0}`)
          .join('\n');

        const notificationContent = `New course recommendations based on your interests! We found ${recommendedCourses.length} courses you might like.`;

        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          content: notificationContent,
          type: 'course_recommendation',
          related_id: null
        });

        // Create detailed inbox message
        await supabase.from('inbox_messages').insert({
          recipient_id: user.id,
          subject: 'New Course Recommendations Just for You!',
          content: `Hi ${user.full_name},\n\nWe've curated some exciting courses based on your learning journey:\n\n${courseList}\n\nThese recommendations are tailored to your interests and learning history. Check them out to continue growing your skills!\n\nHappy Learning!\nThe Learning Team`,
          message_type: 'course_recommendation'
        });

        console.log(`Course recommendations sent to user ${user.id}`);
        recommendationsSent++;

      } catch (error) {
        console.error(`Error sending recommendations to user ${user.id}:`, error);
        recommendationsSkipped++;
      }
    }

    console.log(`Course recommendations completed. Sent: ${recommendationsSent}, Skipped: ${recommendationsSkipped}`);

    return new Response(JSON.stringify({
      message: 'Course recommendations processed successfully',
      stats: {
        sent: recommendationsSent,
        skipped: recommendationsSkipped,
        usersProcessed: targetUsers.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error sending course recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);