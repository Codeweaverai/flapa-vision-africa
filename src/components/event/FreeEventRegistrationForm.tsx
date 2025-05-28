
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Event } from '@/services/eventService';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface FreeEventRegistrationFormProps {
  event: Event;
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const FreeEventRegistrationForm = ({ 
  event, 
  user, 
  onSuccess, 
  onCancel 
}: FreeEventRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('event_bookings')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          payment_status: 'free',
          payment_amount: 0,
          payment_currency: event.currency || 'USD'
        });

      if (error) throw error;

      toast.success(`Successfully registered for ${event.title}!`);
      onSuccess();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error('Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Free Event Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This is a free event! Click confirm to complete your registration.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Registering..." : "Confirm Registration"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FreeEventRegistrationForm;
