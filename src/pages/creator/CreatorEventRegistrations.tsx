
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CombinedRegistration, EventWithRegistrations } from '@/types/eventTypes';
import EventRegistrationsTable from '@/components/event/EventRegistrationsTable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const CreatorEventRegistrations = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventWithRegistrations | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);

  useEffect(() => {
    if (user && eventId) {
      fetchEventWithRegistrations();
    }
  }, [user, eventId]);

  const fetchEventWithRegistrations = async () => {
    if (!eventId || !user) return;
    
    setLoading(true);
    try {
      // First, fetch the event details and check ownership
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('creator_id', user.id)
        .single();
        
      if (eventError) {
        throw new Error("Event not found or you don't have permission to access it");
      }

      // Fetch registrations for this event
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          *,
          profiles:user_id(id, email, full_name)
        `)
        .eq('event_id', eventId);
        
      if (registrationsError) throw registrationsError;

      // Format the registrations data
      const formattedRegistrations: CombinedRegistration[] = registrationsData.map((reg: any) => ({
        ...reg,
        user: {
          id: reg.profiles?.id,
          email: reg.profiles?.email,
          full_name: reg.profiles?.full_name
        }
      }));

      // Create the EventWithRegistrations object
      const eventWithRegistrations: EventWithRegistrations = {
        ...eventData,
        date: eventData.start_time,
        registrations: formattedRegistrations
      };

      setEvent(eventWithRegistrations);
    } catch (error: any) {
      console.error('Error fetching event registrations:', error);
      toast.error(error.message || 'Failed to load event registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRegistration = (registration: CombinedRegistration) => {
    setSelectedRegistration(registration);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRegistration = async (registration: CombinedRegistration) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registration.id);

      if (error) {
        throw error;
      }

      // Update state by removing the deleted registration
      if (event) {
        setEvent({
          ...event,
          registrations: event.registrations.filter(reg => reg.id !== registration.id)
        });
      }

      toast.success('Registration deleted successfully');
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    }
  };

  // Form schema for editing registration
  const formSchema = z.object({
    status: z.string(),
    payment_status: z.string(),
    phone_number: z.string().optional(),
    mobile_operator: z.string().optional()
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: selectedRegistration?.status || 'confirmed',
      payment_status: selectedRegistration?.payment_status || 'pending',
      phone_number: selectedRegistration?.phone_number || '',
      mobile_operator: selectedRegistration?.mobile_operator || '',
    },
  });

  useEffect(() => {
    // Update form values when selected registration changes
    if (selectedRegistration) {
      form.reset({
        status: selectedRegistration.status,
        payment_status: selectedRegistration.payment_status,
        phone_number: selectedRegistration.phone_number || '',
        mobile_operator: selectedRegistration.mobile_operator || '',
      });
    }
  }, [selectedRegistration, form]);

  const handleSaveRegistration = async (values: z.infer<typeof formSchema>) => {
    if (!selectedRegistration) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status: values.status,
          payment_status: values.payment_status,
          phone_number: values.phone_number,
          mobile_operator: values.mobile_operator
        })
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      // Update state
      if (event) {
        setEvent({
          ...event,
          registrations: event.registrations.map(reg => 
            reg.id === selectedRegistration.id ? 
            { ...reg, ...values } : reg
          )
        });
      }

      toast.success('Registration updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    }
  };

  return (
    <CreatorLayout title="Event Registrations">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : event ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{event.title} - Registrations</CardTitle>
              <CardDescription>
                {event.registrations.length} {event.registrations.length === 1 ? 'registration' : 'registrations'} 
                {event.capacity ? ` (${event.registrations.length}/${event.capacity} spots filled)` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventRegistrationsTable 
                registrations={event.registrations}
                loading={loading}
                onEdit={handleEditRegistration}
                onDelete={handleDeleteRegistration}
                isCreator={true}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load event registrations. The event may not exist or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Registration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update the registration details for {selectedRegistration?.user?.full_name}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveRegistration)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile_operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Operator</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default CreatorEventRegistrations;
