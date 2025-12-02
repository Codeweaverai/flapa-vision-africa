-- Fix search_path for check_campaign_completion
CREATE OR REPLACE FUNCTION public.check_campaign_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix search_path for cleanup_old_event_embeddings_ai
CREATE OR REPLACE FUNCTION public.cleanup_old_event_embeddings_ai(days_old integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM event_embeddings_ai 
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Fix search_path for match_documents
CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT 5, filter_course_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.metadata,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  FROM document_embeddings
  WHERE (filter_course_id IS NULL OR document_embeddings.metadata->>'course_id' = filter_course_id::text)
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Fix search_path for match_event_embeddings_ai
CREATE OR REPLACE FUNCTION public.match_event_embeddings_ai(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5)
RETURNS TABLE(id uuid, event_title text, event_description text, event_type text, key_topics text[], target_audience text, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    event_embeddings_ai.id,
    event_embeddings_ai.event_title,
    event_embeddings_ai.event_description,
    event_embeddings_ai.event_type,
    event_embeddings_ai.key_topics,
    event_embeddings_ai.target_audience,
    1 - (event_embeddings_ai.embedding <=> query_embedding) as similarity
  FROM event_embeddings_ai
  WHERE 1 - (event_embeddings_ai.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;

-- Fix search_path for generate_certificate_on_completion
CREATE OR REPLACE FUNCTION public.generate_certificate_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_all_lessons_completed boolean;
  v_quizzes_passed boolean;
  v_final_exam_passed boolean;
  v_has_final_exam boolean;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_certificate_exists boolean;
BEGIN
  IF NEW.completion_date IS NOT NULL AND OLD.completion_date IS NULL THEN
    
    SELECT EXISTS(
      SELECT 1 FROM certificates 
      WHERE enrollment_id = NEW.id
    ) INTO v_certificate_exists;
    
    IF v_certificate_exists THEN
      RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_total_lessons
    FROM lessons l
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE cm.course_id = NEW.course_id;
    
    SELECT COUNT(*) INTO v_completed_lessons
    FROM lesson_progress lp
    WHERE lp.enrollment_id = NEW.id AND lp.is_completed = true;
    
    v_all_lessons_completed := (v_completed_lessons = v_total_lessons AND v_total_lessons > 0);
    
    SELECT EXISTS(
      SELECT 1 FROM final_exams 
      WHERE course_id = NEW.course_id AND is_published = true
    ) INTO v_has_final_exam;

    IF v_has_final_exam THEN
      SELECT EXISTS(
        SELECT 1 
        FROM final_exam_attempts fea
        JOIN final_exams fe ON fea.exam_id = fe.id
        WHERE fea.user_id = NEW.user_id 
        AND fea.enrollment_id = NEW.id
        AND fea.passed = true
        AND fe.course_id = NEW.course_id
      ) INTO v_final_exam_passed;
    ELSE
      v_final_exam_passed := true;
    END IF;

    IF NOT v_has_final_exam THEN
      SELECT NOT EXISTS(
        SELECT 1 
        FROM (
          SELECT q.id
          FROM quizzes q
          JOIN lessons l ON q.lesson_id = l.id
          JOIN course_modules cm ON l.module_id = cm.id
          WHERE cm.course_id = NEW.course_id
          
          UNION ALL
          
          SELECT q.id
          FROM quizzes q
          JOIN course_modules cm ON q.module_id = cm.id
          WHERE cm.course_id = NEW.course_id AND q.lesson_id IS NULL
        ) all_quizzes
        WHERE NOT EXISTS(
          SELECT 1 
          FROM quiz_attempts qa 
          WHERE qa.quiz_id = all_quizzes.id 
          AND qa.user_id = NEW.user_id 
          AND qa.enrollment_id = NEW.id
          AND qa.passed = true
        )
      ) INTO v_quizzes_passed;
    ELSE
      v_quizzes_passed := true;
    END IF;

    IF v_all_lessons_completed AND v_final_exam_passed AND v_quizzes_passed THEN
      INSERT INTO certificates (
        enrollment_id,
        verification_code,
        user_id,
        course_id,
        issue_date
      ) VALUES (
        NEW.id,
        'SP-' || encode(gen_random_bytes(4), 'hex') || '-' || encode(gen_random_bytes(3), 'hex'),
        NEW.user_id,
        NEW.course_id,
        NOW()
      );
      
      RAISE NOTICE 'Certificate issued for enrollment %', NEW.id;
    ELSE
      RAISE NOTICE 'Certificate not issued - completion conditions not met for enrollment %', NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;