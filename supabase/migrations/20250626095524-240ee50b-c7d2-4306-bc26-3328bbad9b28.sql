
-- Add action_ids column to ai_chat_history table
ALTER TABLE public.ai_chat_history 
ADD COLUMN action_ids JSONB DEFAULT NULL;
