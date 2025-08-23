
-- First, let's tighten the existing workplace policies for courses and events by removing the "workplace_id IS NULL" branches

-- Update courses policies to remove the NULL workplace_id branches
DROP POLICY IF EXISTS "Workplace editors can manage workplace courses" ON public.courses;
DROP POLICY IF EXISTS "Workplace members can view workplace courses" ON public.courses;

CREATE POLICY "Workplace editors can manage workplace courses" 
ON public.courses FOR ALL 
USING (can_edit_workplace_content(workplace_id))
WITH CHECK (can_edit_workplace_content(workplace_id));

CREATE POLICY "Workplace members can view workplace courses" 
ON public.courses FOR SELECT 
USING (is_workplace_member(workplace_id));

-- Update events policies to remove the NULL workplace_id branches  
DROP POLICY IF EXISTS "Workplace editors can manage workplace events" ON public.events;
DROP POLICY IF EXISTS "Workplace members can view workplace events" ON public.events;

CREATE POLICY "Workplace editors can manage workplace events" 
ON public.events FOR ALL 
USING (can_edit_workplace_content(workplace_id))
WITH CHECK (can_edit_workplace_content(workplace_id));

CREATE POLICY "Workplace members can view workplace events" 
ON public.events FOR SELECT 
USING (is_workplace_member(workplace_id));

-- Course modules policies
CREATE POLICY "Workplace editors can manage course modules" 
ON public.course_modules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_modules.course_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_modules.course_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
);

CREATE POLICY "Workplace members can view course modules" 
ON public.course_modules FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_modules.course_id 
    AND is_workplace_member(c.workplace_id)
  )
);

-- Lessons policies
CREATE POLICY "Workplace editors can manage lessons" 
ON public.lessons FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    JOIN course_modules cm ON c.id = cm.course_id
    WHERE cm.id = lessons.module_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c 
    JOIN course_modules cm ON c.id = cm.course_id
    WHERE cm.id = lessons.module_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
);

CREATE POLICY "Workplace members can view lessons" 
ON public.lessons FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    JOIN course_modules cm ON c.id = cm.course_id
    WHERE cm.id = lessons.module_id 
    AND is_workplace_member(c.workplace_id)
  )
);

-- Course learning outcomes policies
CREATE POLICY "Workplace editors can manage learning outcomes" 
ON public.course_learning_outcomes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_learning_outcomes.course_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_learning_outcomes.course_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
);

CREATE POLICY "Workplace members can view learning outcomes" 
ON public.course_learning_outcomes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_learning_outcomes.course_id 
    AND is_workplace_member(c.workplace_id)
  )
);

-- Course previews policies
CREATE POLICY "Workplace editors can manage course previews" 
ON public.course_previews FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_previews.course_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_previews.course_id 
    AND can_edit_workplace_content(c.workplace_id)
  )
);

CREATE POLICY "Workplace members can view course previews" 
ON public.course_previews FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_previews.course_id 
    AND is_workplace_member(c.workplace_id)
  )
);

-- Event agenda policies
CREATE POLICY "Workplace editors can manage event agenda" 
ON public.event_agenda FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_agenda.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_agenda.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
);

CREATE POLICY "Workplace members can view event agenda" 
ON public.event_agenda FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_agenda.event_id 
    AND is_workplace_member(e.workplace_id)
  )
);

-- Event tickets policies
CREATE POLICY "Workplace editors can manage event tickets" 
ON public.event_tickets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_tickets.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_tickets.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
);

CREATE POLICY "Workplace members can view event tickets" 
ON public.event_tickets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_tickets.event_id 
    AND is_workplace_member(e.workplace_id)
  )
);

-- Check-ins policies
CREATE POLICY "Workplace editors can manage check-ins" 
ON public.check_ins FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = check_ins.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
);

CREATE POLICY "Workplace editors can view check-ins" 
ON public.check_ins FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = check_ins.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
);

-- Event bookings policies for workspace editors to view attendees
CREATE POLICY "Workplace editors can view event bookings" 
ON public.event_bookings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_bookings.event_id 
    AND can_edit_workplace_content(e.workplace_id)
  )
);
