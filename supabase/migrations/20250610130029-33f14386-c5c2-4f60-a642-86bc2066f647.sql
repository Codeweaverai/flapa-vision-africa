
-- Create table for AI assistant chat history
CREATE TABLE public.ai_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own chat history
CREATE POLICY "Users can view their own chat history" 
  ON public.ai_chat_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own chat history
CREATE POLICY "Users can create their own chat history" 
  ON public.ai_chat_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own chat history
CREATE POLICY "Users can update their own chat history" 
  ON public.ai_chat_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own chat history
CREATE POLICY "Users can delete their own chat history" 
  ON public.ai_chat_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX idx_ai_chat_history_lesson_id ON public.ai_chat_history(lesson_id);
CREATE INDEX idx_ai_chat_history_course_id ON public.ai_chat_history(course_id);
CREATE INDEX idx_ai_chat_history_created_at ON public.ai_chat_history(created_at DESC);
