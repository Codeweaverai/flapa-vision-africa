
-- Create job_openings table
CREATE TABLE public.job_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full-time',
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  responsibilities TEXT,
  salary_range TEXT,
  benefits TEXT,
  application_deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_opening_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  phone_number TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  linkedin_profile TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_openings
CREATE POLICY "Anyone can view active job openings" 
  ON public.job_openings 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage job openings" 
  ON public.job_openings 
  FOR ALL 
  USING (public.is_admin());

-- RLS policies for job_applications
CREATE POLICY "Admins can view all applications" 
  ON public.job_applications 
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can manage applications" 
  ON public.job_applications 
  FOR ALL 
  USING (public.is_admin());

-- Create indexes for better performance
CREATE INDEX idx_job_openings_active ON public.job_openings(is_active);
CREATE INDEX idx_job_openings_department ON public.job_openings(department);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_opening_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
