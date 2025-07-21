
-- Create table for Help Center FAQs
CREATE TABLE public.help_center_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Getting Started', 'Account Settings', 'Billing & Payments', 'Privacy & Security')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.help_center_faqs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published FAQs" 
  ON public.help_center_faqs 
  FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Admins can manage all FAQs" 
  ON public.help_center_faqs 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ));

-- Create index for better performance
CREATE INDEX idx_help_center_faqs_category ON public.help_center_faqs(category);
CREATE INDEX idx_help_center_faqs_order ON public.help_center_faqs(order_index);
