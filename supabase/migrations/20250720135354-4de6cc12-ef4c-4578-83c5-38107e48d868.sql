
-- Drop existing policies for lesson_transcripts
DROP POLICY IF EXISTS "Authenticated users can view lesson transcripts" ON public.lesson_transcripts;
DROP POLICY IF EXISTS "Admins can manage lesson transcripts" ON public.lesson_transcripts;

-- Create new policies that allow course creators to manage transcripts for their courses
CREATE POLICY "Users can view lesson transcripts" 
  ON public.lesson_transcripts 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Course creators can insert lesson transcripts" 
  ON public.lesson_transcripts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.course_modules cm ON l.module_id = cm.id
      JOIN public.courses c ON cm.course_id = c.id
      WHERE l.id = lesson_id AND (c.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Course creators can update lesson transcripts" 
  ON public.lesson_transcripts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.course_modules cm ON l.module_id = cm.id
      JOIN public.courses c ON cm.course_id = c.id
      WHERE l.id = lesson_id AND (c.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Course creators can delete lesson transcripts" 
  ON public.lesson_transcripts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.course_modules cm ON l.module_id = cm.id
      JOIN public.courses c ON cm.course_id = c.id
      WHERE l.id = lesson_id AND (c.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );
