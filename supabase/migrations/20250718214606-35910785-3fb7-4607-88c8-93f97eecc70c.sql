
-- Update RLS policies for course_modules to allow creators to manage their modules
DROP POLICY IF EXISTS "Course creators can manage their modules" ON public.course_modules;
DROP POLICY IF EXISTS "Only admins can insert modules" ON public.course_modules;
DROP POLICY IF EXISTS "Only admins can update modules" ON public.course_modules;
DROP POLICY IF EXISTS "Only admins can delete modules" ON public.course_modules;

-- Create new policies that allow course creators to manage their modules
CREATE POLICY "Course creators can manage their modules" 
  ON public.course_modules 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND courses.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND courses.creator_id = auth.uid()
    )
  );

-- Also allow admins to manage all modules
CREATE POLICY "Admins can manage all modules" 
  ON public.course_modules 
  FOR ALL 
  USING (is_admin())
  WITH CHECK (is_admin());
