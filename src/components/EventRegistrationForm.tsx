
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Event, registerForEvent } from '@/services/eventService';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';

interface EventRegistrationFormProps {
  event: Event;
  user: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ 
  event, 
  user,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formSchema = z.object({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const handleFreeRegistration = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const result = await registerForEvent(event, user);
      if (result) {
        toast.success(`Successfully registered for ${event.title}`);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error during free registration:", error);
      toast.error("Failed to register for event");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const result = await registerForEvent(event, user);
      
      if (result && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error during paid registration:", error);
      toast.error("Failed to process registration");
    } finally {
      setLoading(false);
    }
  };

  if (event.is_free) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Free Event Registration</CardTitle>
          <CardDescription>Register for {event.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This is a free event! Click the button below to confirm your registration.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            onClick={handleFreeRegistration} 
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Registration"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Event Registration</CardTitle>
        <CardDescription>Register for {event.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Registration fee: {event.currency || 'USD'} {event.price}
              </p>
              <p className="text-sm mb-4">
                You will be redirected to our secure payment provider to complete your registration.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Continue to Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventRegistrationForm;
