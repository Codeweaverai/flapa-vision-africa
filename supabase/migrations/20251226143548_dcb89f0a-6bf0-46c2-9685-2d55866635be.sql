-- Fix search_path for generate_certificate_on_completion function
CREATE OR REPLACE FUNCTION public.generate_certificate_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    course_has_certificate BOOLEAN;
    verification_code TEXT;
BEGIN
    -- Debug logging
    RAISE NOTICE 'Checking certificate generation for enrollment %', NEW.id;
    
    -- Check if the course has certificates enabled
    SELECT certificate_enabled INTO course_has_certificate 
    FROM public.courses 
    WHERE id = NEW.course_id;
    
    -- Only proceed if:
    -- 1. Course has certificates enabled
    -- 2. Completion date is newly set (or changed from null)
    IF course_has_certificate = true AND 
       NEW.completion_date IS NOT NULL AND 
       (OLD.completion_date IS NULL OR OLD.completion_date != NEW.completion_date) THEN
        
        -- Check if certificate already exists for this enrollment
        IF NOT EXISTS (SELECT 1 FROM certificates WHERE enrollment_id = NEW.id) THEN
            -- Generate verification code using pgcrypto
            -- Format: SP-XXXX-YYYY where XXXX and YYYY are hex strings
            verification_code := 'SP-' || 
                                encode(gen_random_bytes(3), 'hex') || '-' ||
                                encode(gen_random_bytes(3), 'hex');
            
            -- Insert certificate with correct column names from your schema
            INSERT INTO public.certificates (
                enrollment_id,
                verification_code,
                user_id,
                course_id,
                issue_date
            ) VALUES (
                NEW.id,
                verification_code,
                NEW.user_id,
                NEW.course_id,
                NOW()
            );
            
            RAISE NOTICE 'Generated certificate with code % for enrollment %', verification_code, NEW.id;
        ELSE
            RAISE NOTICE 'Certificate already exists for enrollment %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;