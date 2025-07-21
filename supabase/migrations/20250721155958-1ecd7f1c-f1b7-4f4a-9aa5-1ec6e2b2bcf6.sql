
-- Create table for help center FAQs
CREATE TABLE public.help_center_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.help_center_faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for help_center_faqs
CREATE POLICY "Anyone can view published FAQs" 
  ON public.help_center_faqs 
  FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Admins can manage all FAQs" 
  ON public.help_center_faqs 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ));

-- Insert some initial FAQ data for each category
INSERT INTO public.help_center_faqs (category, question, answer, order_index) VALUES
-- Getting Started
('Getting Started', 'How do I create an account?', 'Click the ''Sign Up'' button in the top right corner and fill out the registration form with your email and password.', 1),
('Getting Started', 'How do I enroll in a course?', 'Browse our course catalog, select the course you''re interested in, and click the ''Enroll Now'' button. For paid courses, you''ll need to complete the payment process.', 2),
('Getting Started', 'How do I navigate the platform?', 'Use the main navigation menu to access different sections like Courses, Events, Community, and your account dashboard.', 3),

-- Account Settings
('Account Settings', 'How do I update my profile?', 'Go to your account settings page and click on ''Profile'' to update your personal information, bio, and profile picture.', 1),
('Account Settings', 'How do I change my password?', 'In your account settings, click on ''Security'' and then ''Change Password'' to update your login credentials.', 2),
('Account Settings', 'How do I enable creator mode?', 'Visit your account settings and look for the ''Creator Mode'' option to start creating and selling courses.', 3),

-- Billing & Payments
('Billing & Payments', 'What payment methods do you accept?', 'We accept major credit cards, PayPal, and mobile money payments for supported regions.', 1),
('Billing & Payments', 'How do refunds work?', 'We offer refunds within 30 days of purchase if you''re not satisfied with the course. Contact our support team for assistance.', 2),
('Billing & Payments', 'How do I get paid as a creator?', 'Creator earnings are processed through Stripe or mobile money based on your preference. Payouts are made according to our payout schedule.', 3),

-- Privacy & Security
('Privacy & Security', 'How is my data protected?', 'We use industry-standard encryption and security measures to protect your personal information and payment data.', 1),
('Privacy & Security', 'Can I delete my account?', 'Yes, you can request account deletion through your account settings or by contacting our support team.', 2),
('Privacy & Security', 'Who can see my information?', 'Your profile information visibility can be controlled in your privacy settings. We never share personal data with third parties without consent.', 3);
