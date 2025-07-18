
-- Drop existing policies for lessons table
DROP POLICY IF EXISTS "Users can view lessons for published courses or enrolled courses" ON public.lessons;
DROP POLICY IF EXISTS "Course creators can manage their lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;

-- Create comprehensive RLS policies for lessons table
CREATE POLICY "Anyone can view lessons for published courses or enrolled courses" 
ON public.lessons 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    WHERE cm.id = lessons.module_id 
    AND (
      c.is_published = true 
      OR EXISTS (
        SELECT 1 
        FROM course_enrollments ce 
        WHERE ce.course_id = c.id 
        AND ce.user_id = auth.uid()
      )
      OR c.creator_id = auth.uid()
      OR is_admin()
    )
  )
);

-- Allow course creators to insert lessons in their courses
CREATE POLICY "Course creators can insert lessons in their courses" 
ON public.lessons 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    WHERE cm.id = lessons.module_id 
    AND c.creator_id = auth.uid()
  )
);

-- Allow course creators to update lessons in their courses
CREATE POLICY "Course creators can update lessons in their courses" 
ON public.lessons 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    WHERE cm.id = lessons.module_id 
    AND c.creator_id = auth.uid()
  )
);

-- Allow course creators to delete lessons in their courses
CREATE POLICY "Course creators can delete lessons in their courses" 
ON public.lessons 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    WHERE cm.id = lessons.module_id 
    AND c.creator_id = auth.uid()
  )
);

-- Allow admins to manage all lessons
CREATE POLICY "Admins can manage all lessons" 
ON public.lessons 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());
