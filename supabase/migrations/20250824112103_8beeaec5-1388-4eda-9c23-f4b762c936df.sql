
-- Allow workspace members to view tickets for events in their workspace
CREATE POLICY "Workplace members can view generated tickets for workspace events"
ON public.generated_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.id = generated_tickets.event_id
      AND is_workplace_member(e.workplace_id)
  )
);

-- Allow workspace members to view event bookings (read-only)
CREATE POLICY "Workplace members can view event bookings"
ON public.event_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.id = event_bookings.event_id
      AND is_workplace_member(e.workplace_id)
  )
);

-- Allow workspace members to view check-in status (read-only)
CREATE POLICY "Workplace members can view check-ins"
ON public.check_ins
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.id = check_ins.event_id
      AND is_workplace_member(e.workplace_id)
  )
);
