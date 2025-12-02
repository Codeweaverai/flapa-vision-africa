-- Fix search_path for auto_complete_course_no_exam
CREATE OR REPLACE FUNCTION public.auto_complete_course_no_exam()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  course_has_exam BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO total_lessons
  FROM lessons l
  JOIN course_modules cm ON l.module_id = cm.id
  WHERE cm.course_id = (SELECT course_id FROM course_enrollments WHERE id = NEW.enrollment_id);
  
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress
  WHERE enrollment_id = NEW.enrollment_id AND is_completed = true;
  
  SELECT EXISTS (
    SELECT 1 FROM final_exams 
    WHERE course_id = (SELECT course_id FROM course_enrollments WHERE id = NEW.enrollment_id)
    AND is_published = true
  ) INTO course_has_exam;
  
  IF NOT course_has_exam AND completed_lessons >= total_lessons AND total_lessons > 0 THEN
    UPDATE course_enrollments 
    SET completed_at = NOW()
    WHERE id = NEW.enrollment_id AND completed_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix search_path for search_courses_by_embedding
CREATE OR REPLACE FUNCTION public.search_courses_by_embedding(query_embedding vector, match_threshold double precision, match_count integer)
RETURNS TABLE(id uuid, title text, category text, difficulty_level text, price numeric, is_free boolean, duration_minutes integer, thumbnail_url text, creator_id uuid, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.category,
    c.difficulty_level,
    c.price,
    c.is_free,
    c.duration_minutes,
    c.thumbnail_url,
    c.creator_id,
    1 - (ce.embedding <=> query_embedding) as similarity
  FROM course_embeddings ce
  JOIN courses c ON ce.course_id = c.id
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
    AND c.is_published = true
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Fix search_path for search_events_by_embedding
CREATE OR REPLACE FUNCTION public.search_events_by_embedding(query_embedding vector, match_threshold double precision, match_count integer)
RETURNS TABLE(id uuid, title text, event_type text, start_time timestamp with time zone, end_time timestamp with time zone, location text, image_url text, price numeric, is_free boolean, creator_id uuid, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.event_type,
    e.start_time,
    e.end_time,
    e.location,
    e.image_url,
    e.price,
    e.is_free,
    e.creator_id,
    1 - (ee.embedding <=> query_embedding) as similarity
  FROM event_embeddings ee
  JOIN events e ON ee.event_id = e.id
  WHERE 1 - (ee.embedding <=> query_embedding) > match_threshold
    AND e.is_published = true
    AND e.start_time > NOW()
  ORDER BY ee.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Fix search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Fix search_path for update_campaign_current_amount
CREATE OR REPLACE FUNCTION public.update_campaign_current_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE fundraising_campaigns 
    SET current_amount = current_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    UPDATE fundraising_campaigns 
    SET current_amount = current_amount - OLD.amount,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix search_path for update_reward_claimed_count
CREATE OR REPLACE FUNCTION public.update_reward_claimed_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.reward_id IS NOT NULL THEN
    UPDATE campaign_rewards 
    SET claimed_count = claimed_count + 1
    WHERE id = NEW.reward_id;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' AND OLD.reward_id IS NOT NULL THEN
    UPDATE campaign_rewards 
    SET claimed_count = GREATEST(0, claimed_count - 1)
    WHERE id = OLD.reward_id;
  END IF;
  RETURN NEW;
END;
$function$;