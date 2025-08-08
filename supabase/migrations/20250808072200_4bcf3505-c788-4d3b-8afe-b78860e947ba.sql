
-- Create newsletter templates table
CREATE TABLE public.newsletter_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- general, course, event, promotional, engagement
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  thumbnail_url TEXT,
  placeholders JSONB DEFAULT '[]'::jsonb, -- Available placeholders for this template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for newsletter templates
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;

-- Admin can manage all templates
CREATE POLICY "Admins can manage newsletter templates" 
  ON public.newsletter_templates 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ));

-- Everyone can view active templates (for preview)
CREATE POLICY "Active templates are viewable by admins" 
  ON public.newsletter_templates 
  FOR SELECT 
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ));

-- Add template_id to newsletters table to track which template was used
ALTER TABLE public.newsletters ADD COLUMN template_id UUID REFERENCES public.newsletter_templates(id);

-- Insert default templates
INSERT INTO public.newsletter_templates (name, description, category, subject_template, body_html_template, placeholders) VALUES
(
  'New Course Launch',
  'Announce a new course with beautiful course card and call-to-action',
  'course',
  '🎉 New Course Alert: {{course.title}} is Now Live!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f97316, #a855f7); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 New Course Launch!</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Expand your skills with our latest course</p>
    </div>
    
    <!-- Course Card -->
    <div style="padding: 30px;">
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        {{#course.thumbnail_url}}
        <img src="{{course.thumbnail_url}}" alt="{{course.title}}" style="width: 100%; height: 200px; object-fit: cover;">
        {{/course.thumbnail_url}}
        
        <div style="padding: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px; font-weight: bold;">{{course.title}}</h2>
          <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">{{course.description}}</p>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="background-color: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 20px; font-size: 14px;">{{course.difficulty_level}}</span>
              <span style="color: #6b7280; font-size: 14px;">⏱️ {{course.duration_minutes}} mins</span>
            </div>
            <div style="text-align: right;">
              {{#course.is_free}}
              <span style="font-size: 24px; font-weight: bold; color: #10b981;">FREE</span>
              {{/course.is_free}}
              {{^course.is_free}}
              <span style="font-size: 24px; font-weight: bold; color: #f97316;">${{course.price}}</span>
              {{/course.is_free}}
            </div>
          </div>
          
          <a href="https://skillpulse.cloud/courses/{{course.id}}" style="display: block; background: linear-gradient(135deg, #f97316, #a855f7); color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 16px;">
            🚀 Enroll Now
          </a>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Happy learning! 📚</p>
    </div>
  </div>
</body>
</html>',
  '["course.title", "course.description", "course.thumbnail_url", "course.difficulty_level", "course.duration_minutes", "course.is_free", "course.price", "course.id"]'::jsonb
),
(
  'Event Announcement',
  'Promote upcoming events with event details and registration CTA',
  'event',
  '📅 Don''t Miss Out: {{event.title}} - {{event.start_date}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">📅 Upcoming Event</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Mark your calendar!</p>
    </div>
    
    <!-- Event Card -->
    <div style="padding: 30px;">
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        {{#event.image_url}}
        <img src="{{event.image_url}}" alt="{{event.title}}" style="width: 100%; height: 200px; object-fit: cover;">
        {{/event.image_url}}
        
        <div style="padding: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px; font-weight: bold;">{{event.title}}</h2>
          <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">{{event.description}}</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151; font-weight: bold;">📅 Date:</span>
              <span style="color: #6b7280;">{{event.start_date}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151; font-weight: bold;">⏰ Time:</span>
              <span style="color: #6b7280;">{{event.start_time}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151; font-weight: bold;">📍 Location:</span>
              <span style="color: #6b7280;">{{event.location}}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #374151; font-weight: bold;">💰 Price:</span>
              <span style="color: #6b7280; font-weight: bold;">${{event.price}}</span>
            </div>
          </div>
          
          <a href="https://skillpulse.cloud/events/{{event.id}}" style="display: block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 16px;">
            🎫 Register Now
          </a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>',
  '["event.title", "event.description", "event.image_url", "event.start_date", "event.start_time", "event.location", "event.price", "event.id"]'::jsonb
),
(
  'Weekly Digest',
  'Weekly roundup of courses and events with multiple content cards',
  'general',
  '📰 Your Weekly Learning Digest - {{week_date}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">📰 Weekly Digest</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your learning opportunities this week</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 30px;">Hello {{full_name}},<br><br>Here''s what''s new and exciting this week on SkillPulse!</p>
      
      <!-- New Courses Section -->
      <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🎓 New Courses</h2>
      {{course_cards}}
      
      <!-- Upcoming Events Section -->
      <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 30px 0 20px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📅 Upcoming Events</h2>
      {{event_cards}}
      
      <!-- CTA -->
      <div style="text-align: center; margin-top: 40px;">
        <a href="https://skillpulse.cloud" style="display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          🚀 Explore All Learning
        </a>
      </div>
    </div>
  </div>
</body>
</html>',
  '["full_name", "week_date", "course_cards", "event_cards"]'::jsonb
),
(
  'Limited-Time Offer',
  'Create urgency with special promotions and discounts',
  'promotional',
  '⏰ URGENT: {{discount}}% OFF - Only {{time_left}} Left!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Urgent Header -->
    <div style="background: linear-gradient(135deg, #dc2626, #f97316); padding: 20px; text-align: center;">
      <div style="background-color: #ffffff; color: #dc2626; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 14px; margin-bottom: 15px;">
        ⚡ LIMITED TIME OFFER
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">{{discount}}% OFF</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Everything Must Go!</p>
    </div>
    
    <!-- Countdown -->
    <div style="background-color: #fef2f2; padding: 20px; text-align: center; border-bottom: 3px solid #dc2626;">
      <h2 style="margin: 0; color: #dc2626; font-size: 24px;">⏰ Only {{time_left}} Remaining!</h2>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 25px;">Don''t miss out on this incredible opportunity to level up your skills at an unbeatable price!</p>
      
      <div style="background: linear-gradient(135deg, #fef3c7, #fed7aa); padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 20px;">Use Code:</h3>
        <div style="background-color: #ffffff; color: #dc2626; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; border: 2px dashed #dc2626;">
          {{promo_code}}
        </div>
      </div>
      
      <!-- Course/Event Cards -->
      {{featured_content}}
      
      <!-- CTA -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://skillpulse.cloud?promo={{promo_code}}" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #f97316); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          🔥 Shop Now & Save {{discount}}%
        </a>
      </div>
      
      <p style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">*Offer expires in {{time_left}}. Cannot be combined with other offers.</p>
    </div>
  </div>
</body>
</html>',
  '["discount", "time_left", "promo_code", "featured_content"]'::jsonb
),
(
  'Re-engagement Campaign',
  'Win back inactive users with special offers',
  'engagement',
  '👋 We Miss You! Come Back for 30% OFF',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); padding: 40px 30px; text-align: center;">
      <div style="font-size: 60px; margin-bottom: 10px;">👋</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">We Miss You!</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Let''s get you back on track</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 25px;">Hi {{full_name}},<br><br>We noticed you haven''t been active lately, and we miss having you in our learning community! 🤗</p>
      
      <div style="background: linear-gradient(135deg, #fef3c7, #ddd6fe); padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
        <h2 style="margin: 0 0 15px 0; color: #7c3aed; font-size: 24px;">🎁 Welcome Back Gift</h2>
        <div style="background-color: #ffffff; color: #7c3aed; padding: 15px; border-radius: 8px; font-size: 28px; font-weight: bold; border: 2px solid #7c3aed; margin-bottom: 15px;">
          30% OFF
        </div>
        <p style="margin: 0; color: #6b46c1; font-size: 16px;">On any course or event</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px;">📈 What You''ve Missed:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
          <li style="margin-bottom: 5px;">{{new_courses_count}} new courses added</li>
          <li style="margin-bottom: 5px;">{{new_events_count}} exciting events scheduled</li>
          <li style="margin-bottom: 5px;">{{community_updates}} community discussions</li>
        </ul>
      </div>
      
      <!-- CTA -->
      <div style="text-align: center;">
        <a href="https://skillpulse.cloud?welcome_back=true" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          🚀 Welcome Me Back
        </a>
      </div>
      
      <p style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">This exclusive offer expires in 7 days.</p>
    </div>
  </div>
</body>
</html>',
  '["full_name", "new_courses_count", "new_events_count", "community_updates"]'::jsonb
),
(
  'Creator Spotlight',
  'Highlight featured instructors and their content',
  'general',
  '⭐ Creator Spotlight: Meet {{creator.name}} & Their Amazing Courses',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 10px;">⭐</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Creator Spotlight</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Meet our featured instructor</p>
    </div>
    
    <!-- Creator Profile -->
    <div style="padding: 30px;">
      <div style="display: flex; align-items: center; margin-bottom: 30px; background-color: #f9fafb; padding: 25px; border-radius: 12px;">
        {{#creator.avatar_url}}
        <img src="{{creator.avatar_url}}" alt="{{creator.name}}" style="width: 80px; height: 80px; border-radius: 50%; margin-right: 20px; object-fit: cover;">
        {{/creator.avatar_url}}
        <div>
          <h2 style="margin: 0 0 5px 0; color: #1f2937; font-size: 24px; font-weight: bold;">{{creator.name}}</h2>
          <p style="margin: 0; color: #6b7280; font-size: 16px;">{{creator.title}}</p>
          <div style="margin-top: 10px;">
            <span style="background-color: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">⭐ {{creator.rating}} Rating</span>
            <span style="background-color: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-left: 5px;">👥 {{creator.students}} Students</span>
          </div>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">{{creator.bio}}</p>
      
      <!-- Creator''s Courses -->
      <h3 style="color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 20px;">🎓 Featured Courses by {{creator.name}}</h3>
      
      {{creator_courses}}
      
      <!-- CTA -->
      <div style="text-align: center; margin-top: 30px; background: linear-gradient(135deg, #fef3c7, #fed7aa); padding: 25px; border-radius: 12px;">
        <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 20px;">Want to learn from {{creator.name}}?</h3>
        <a href="https://skillpulse.cloud/creators/{{creator.id}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          👨‍🏫 View All Courses
        </a>
      </div>
    </div>
  </div>
</body>
</html>',
  '["creator.name", "creator.avatar_url", "creator.title", "creator.rating", "creator.students", "creator.bio", "creator.id", "creator_courses"]'::jsonb
);
