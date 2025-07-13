
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can insert modules" ON public.course_modules;
DROP POLICY IF EXISTS "Only admins can update modules" ON public.course_modules;
DROP POLICY IF EXISTS "Only admins can delete modules" ON public.course_modules;

-- Create new policies that allow course creators to manage their modules
CREATE POLICY "Course creators can insert modules for their courses" 
  ON public.course_modules 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND courses.creator_id = auth.uid()
    )
  );

CREATE POLICY "Course creators can update modules for their courses" 
  ON public.course_modules 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND courses.creator_id = auth.uid()
    )
  );

CREATE POLICY "Course creators can delete modules for their courses" 
  ON public.course_modules 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND courses.creator_id = auth.uid()
    )
  );
