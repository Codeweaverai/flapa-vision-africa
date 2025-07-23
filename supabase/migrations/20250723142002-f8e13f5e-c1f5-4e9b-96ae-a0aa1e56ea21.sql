
-- Create check-ins table to track ticket check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.generated_tickets(id),
  booking_id UUID NOT NULL,
  event_id UUID NOT NULL,
  checked_in_by UUID REFERENCES auth.users(id),
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add checked_in column to generated_tickets table if it doesn't exist
ALTER TABLE public.generated_tickets 
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

-- Add RLS policies for check_ins table
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Policy for event organizers to view check-ins for their events
CREATE POLICY "Event creators can view check-ins for their events" 
  ON public.check_ins 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = check_ins.event_id 
      AND events.creator_id = auth.uid()
    )
  );

-- Policy for event organizers to create check-ins for their events
CREATE POLICY "Event creators can create check-ins for their events" 
  ON public.check_ins 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = check_ins.event_id 
      AND events.creator_id = auth.uid()
    )
  );

-- Policy for admins to manage all check-ins
CREATE POLICY "Admins can manage all check-ins" 
  ON public.check_ins 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_check_ins_ticket_id ON public.check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_event_id ON public.check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_generated_tickets_ticket_code ON public.generated_tickets(ticket_code);
