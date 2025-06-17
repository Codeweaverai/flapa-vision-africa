
-- Create newsletters table
CREATE TABLE public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0
);

-- Create newsletter_logs table for tracking delivery
CREATE TABLE public.newsletter_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID REFERENCES public.newsletters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add email_verified column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT true;

-- Add Row Level Security (RLS) policies
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_logs ENABLE ROW LEVEL SECURITY;

-- Newsletter policies - Only admins can manage newsletters
CREATE POLICY "Admins can view all newsletters" 
  ON public.newsletters 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create newsletters" 
  ON public.newsletters 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update newsletters" 
  ON public.newsletters 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete newsletters" 
  ON public.newsletters 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Newsletter logs policies - Only admins can view logs
CREATE POLICY "Admins can view newsletter logs" 
  ON public.newsletter_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert newsletter logs" 
  ON public.newsletter_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletters_status_scheduled ON public.newsletters(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_newsletter_id ON public.newsletter_logs(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified, newsletter_subscribed);

-- Create function to update newsletter statistics
CREATE OR REPLACE FUNCTION update_newsletter_stats(newsletter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.newsletters 
  SET 
    total_recipients = (
      SELECT COUNT(*) FROM public.newsletter_logs 
      WHERE newsletter_logs.newsletter_id = update_newsletter_stats.newsletter_id
    ),
    successful_sends = (
      SELECT COUNT(*) FROM public.newsletter_logs 
      WHERE newsletter_logs.newsletter_id = update_newsletter_stats.newsletter_id 
      AND status = 'sent'
    ),
    failed_sends = (
      SELECT COUNT(*) FROM public.newsletter_logs 
      WHERE newsletter_logs.newsletter_id = update_newsletter_stats.newsletter_id 
      AND status IN ('failed', 'bounced')
    )
  WHERE id = update_newsletter_stats.newsletter_id;
END;
$$;
