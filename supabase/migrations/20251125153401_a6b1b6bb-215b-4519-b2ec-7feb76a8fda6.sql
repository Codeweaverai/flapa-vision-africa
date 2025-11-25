-- Fix function search path security issue by setting search_path on all functions

-- Fix initialize_user_tokens
CREATE OR REPLACE FUNCTION public.initialize_user_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO user_tokens (user_id, balance, free_tokens_available, free_tokens_used, has_used_free_trial)
  VALUES (NEW.id, 0, 30, 0, false);
  RETURN NEW;
END;
$function$;

-- Fix cleanup_campaign_images
CREATE OR REPLACE FUNCTION public.cleanup_campaign_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE NOTICE 'Campaign % deleted. Remember to cleanup storage images for campaign_id: %', OLD.id, OLD.id;
  RETURN OLD;
END;
$function$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix get_event_embeddings_ai_stats
CREATE OR REPLACE FUNCTION public.get_event_embeddings_ai_stats(user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(total_embeddings bigint, user_embeddings bigint, event_types text[], oldest_embedding timestamp with time zone, newest_embedding timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_embeddings,
    COUNT(CASE WHEN ee.creator_id = user_id OR user_id IS NULL THEN 1 END) as user_embeddings,
    ARRAY_AGG(DISTINCT ee.event_type) as event_types,
    MIN(ee.created_at) as oldest_embedding,
    MAX(ee.created_at) as newest_embedding
  FROM event_embeddings_ai ee
  WHERE user_id IS NULL OR ee.creator_id = user_id;
END;
$function$;