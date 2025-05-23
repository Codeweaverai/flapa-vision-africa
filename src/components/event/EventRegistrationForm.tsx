
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMobileOperators } from '@/hooks/useMobileOperators';
import { Event } from '@/services/eventService';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface EventRegistrationFormProps {
  event: Event; 
  user: User | null;
  onRegistrationSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ 
  event, 
  user,
  onRegistrationSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mobileOperators } = useMobileOperators();

  // For paid registrations
  const formSchema = z.object({
    phoneNumber: z.string()
      .min(9, { message: "Phone number must be at least 9 digits" })
      .max(15, { message: "Phone number cannot exceed 15 digits" }),
    mobileOperator: z.string({ required_error: "Please select a mobile operator" })
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      mobileOperator: ''
    },
  });

  const handleFreeRegistration = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // Generate a unique ticket number
      const ticketNumber = `TCKT-${uuidv4().substring(0, 8).toUpperCase()}`;
      
      // Create booking record for free event
      const { data, error } = await supabase.from('event_bookings').insert({
        event_id: event.id,
        user_id: user.id,
        status: 'confirmed',
        payment_status: 'free',
        ticket_number: ticketNumber
      }).select();

      if (error) throw error;

      toast.success(`Successfully registered for ${event.title}`);
      
      if (onRegistrationSuccess && data && data[0]) {
        onRegistrationSuccess(data[0].id);
      } else {
        // Redirect to ticket page if no callback provided
        navigate(`/events/${event.id}/ticket/${data[0].id}`);
      }
    } catch (error) {
      console.error("Error during free registration:", error);
      toast.error("Failed to register for event");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      // Generate a unique ticket number
      const ticketNumber = `TCKT-${uuidv4().substring(0, 8).toUpperCase()}`;
      
      // Create booking record with pending status
      const { data: bookingData, error: bookingError } = await supabase.from('event_bookings').insert({
        event_id: event.id,
        user_id: user.id,
        status: 'pending',
        payment_status: 'pending',
        phone_number: data.phoneNumber,
        mobile_operator: data.mobileOperator,
        ticket_number: ticketNumber
      }).select();
      
      if (bookingError) throw bookingError;
      
      if (!bookingData || !bookingData[0]) {
        throw new Error("Failed to create booking record");
      }
      
      // Create a checkout session using Stripe
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          eventId: event.id,
          eventName: event.title,
          price: event.price || 0,
          currency: event.currency || 'USD',
          returnUrl: `${window.location.origin}/events/${event.id}/ticket/${bookingData[0].id}`
        }
      });
      
      if (checkoutError) throw checkoutError;
      
      if (!checkoutData?.url) {
        throw new Error("Failed to generate checkout URL");
      }
      
      // Open Stripe checkout in a new tab
      window.open(checkoutData.url, '_blank');
      
      // Redirect to ticket page (it will show pending until payment is complete)
      if (onRegistrationSuccess) {
        onRegistrationSuccess(bookingData[0].id);
      } else {
        navigate(`/events/${event.id}/ticket/${bookingData[0].id}`);
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
                Please provide your mobile money details to complete your registration.
              </p>
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Money Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 0977123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileOperator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Network</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mobile operator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mobileOperators.map((operator) => (
                        <SelectItem key={operator.code} value={operator.code}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventRegistrationForm;
