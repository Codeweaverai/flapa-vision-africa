
-- Create table for broadcast messages from admin
CREATE TABLE public.broadcast_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'broadcast',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered')),
  total_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Create policy that allows only admins to view broadcast messages
CREATE POLICY "Only admins can view broadcast messages" 
  ON public.broadcast_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy that allows only admins to create broadcast messages
CREATE POLICY "Only admins can create broadcast messages" 
  ON public.broadcast_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy that allows only admins to update broadcast messages
CREATE POLICY "Only admins can update broadcast messages" 
  ON public.broadcast_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_broadcast_messages_admin_id ON public.broadcast_messages(admin_id);
CREATE INDEX idx_broadcast_messages_created_at ON public.broadcast_messages(created_at DESC);

-- Create function to broadcast message to all users
CREATE OR REPLACE FUNCTION public.broadcast_message_to_all_users(
  p_admin_id UUID,
  p_subject TEXT,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'broadcast',
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  broadcast_id UUID;
  user_count INTEGER;
  user_record RECORD;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can broadcast messages';
  END IF;

  -- Create the broadcast record
  INSERT INTO public.broadcast_messages (
    admin_id, subject, content, message_type, priority
  ) VALUES (
    p_admin_id, p_subject, p_content, p_message_type, p_priority
  ) RETURNING id INTO broadcast_id;

  -- Get count of active users
  SELECT COUNT(*) INTO user_count 
  FROM public.profiles 
  WHERE id IS NOT NULL;

  -- Insert message for each user
  FOR user_record IN 
    SELECT id FROM public.profiles WHERE id IS NOT NULL
  LOOP
    INSERT INTO public.inbox_messages (
      sender_id,
      recipient_id,
      subject,
      content,
      message_type,
      related_id
    ) VALUES (
      NULL, -- System message (no sender)
      user_record.id,
      '[BROADCAST] ' || p_subject,
      p_content,
      p_message_type,
      broadcast_id
    );
  END LOOP;

  -- Update broadcast record with recipient count
  UPDATE public.broadcast_messages 
  SET total_recipients = user_count,
      status = 'delivered'
  WHERE id = broadcast_id;

  RETURN broadcast_id;
END;
$$;
