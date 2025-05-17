
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Event, MobileOperator, fetchMobileOperators, registerForEvent } from '@/services/eventService';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface EventRegistrationFormProps {
  event: Event;
  user: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const phoneRegex = /^[0-9]{10,12}$/;

const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ 
  event, 
  user,
  onSuccess,
  onCancel
}) => {
  const [operators, setOperators] = useState<MobileOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!event.is_free) {
      loadMobileOperators();
    }
  }, [event.is_free]);

  const loadMobileOperators = async () => {
    const data = await fetchMobileOperators();
    setOperators(data);
  };

  const formSchema = z.object({
    phoneNumber: event.is_free 
      ? z.string().optional()
      : z.string().regex(phoneRegex, { message: "Phone number must be 10-12 digits" }),
    mobileOperator: event.is_free 
      ? z.string().optional()
      : z.string({ required_error: "Please select a mobile operator" })
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      mobileOperator: event.is_free ? undefined : "MTN_MOMO_ZMB"
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
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error during free registration:", error);
      toast.error("Failed to register for event");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const result = await registerForEvent(
        event, 
        user, 
        values.phoneNumber, 
        values.mobileOperator
      );
      
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
                Registration fee: {event.currency || 'ZMW'} {event.price}
              </p>
              <p className="text-sm mb-4">
                Please enter your mobile money payment details below.
              </p>
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 260971234567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your mobile money number with country code (e.g. 260)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileOperator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Operator</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mobile operator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {operators.map(op => (
                        <SelectItem key={op.code} value={op.code}>
                          {op.name} ({op.country})
                        </SelectItem>
                      ))}
                      {operators.length === 0 && (
                        <>
                          <SelectItem value="MTN_MOMO_ZMB">MTN Mobile Money (Zambia)</SelectItem>
                          <SelectItem value="AIRTEL_MONEY_ZMB">Airtel Money (Zambia)</SelectItem>
                        </>
                      )}
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
