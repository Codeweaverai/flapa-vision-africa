
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { Event } from '@/services/eventService';
import EventRegistrationsList from './EventRegistrationsList';

interface EventRegistrationButtonProps {
  event: Event;
}

const EventRegistrationButton = ({ event }: EventRegistrationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Registrations
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Registrations - {event.title}</DialogTitle>
            <DialogDescription>
              View all registrations for this event
            </DialogDescription>
          </DialogHeader>
          <EventRegistrationsList eventId={event.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventRegistrationButton;
