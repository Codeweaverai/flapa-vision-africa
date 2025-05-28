
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/services/eventService';
import { User } from '@supabase/supabase-js';
import FreeEventRegistrationForm from './FreeEventRegistrationForm';
import PaidEventRegistrationForm from './PaidEventRegistrationForm';

interface EventRegistrationDialogProps {
  event: Event;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EventRegistrationDialog = ({ 
  event, 
  user, 
  isOpen, 
  onClose, 
  onSuccess 
}: EventRegistrationDialogProps) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleRegistrationSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleProceedToPayment = () => {
    setShowPaymentForm(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogDescription>
            Complete your registration for {event.title}
          </DialogDescription>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription className="mt-2">
                  {event.description}
                </CardDescription>
              </div>
              <Badge variant={event.is_free ? "secondary" : "default"}>
                {event.is_free ? 'Free Event' : `${event.currency} ${event.price}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Date:</strong> {new Date(event.start_time).toLocaleDateString()}
              </div>
              <div>
                <strong>Time:</strong> {new Date(event.start_time).toLocaleTimeString()}
              </div>
              {event.location && (
                <div className="col-span-2">
                  <strong>Location:</strong> {event.location}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {event.is_free ? (
          <FreeEventRegistrationForm 
            event={event}
            user={user}
            onSuccess={handleRegistrationSuccess}
            onCancel={onClose}
          />
        ) : (
          !showPaymentForm ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                This is a paid event. Click continue to proceed with payment.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleProceedToPayment}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          ) : (
            <PaidEventRegistrationForm 
              event={event}
              user={user}
              onSuccess={handleRegistrationSuccess}
              onCancel={onClose}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventRegistrationDialog;
