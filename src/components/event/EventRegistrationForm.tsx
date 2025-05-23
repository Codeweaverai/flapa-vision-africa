
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
import { Event, registerForEvent } from '@/services/eventService';

export interface EventRegistrationFormProps {
  event: Event; 
  user: User | null;
  onRegistrationSuccess?: () => void;
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
      const result = await registerForEvent(event, user);
      if (result) {
        toast.success(`Successfully registered for ${event.title}`);
        if (onRegistrationSuccess) onRegistrationSuccess();
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
      const result = await registerForEvent(event, user, data.phoneNumber, data.mobileOperator);
      
      if (result && onRegistrationSuccess) {
        // Success will be handled by a redirect to the payment provider
        onRegistrationSuccess();
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
                {loading ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventRegistrationForm;
