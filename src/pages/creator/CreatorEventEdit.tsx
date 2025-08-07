import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { VALID_EVENT_TYPES, Event } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketType {
  id: string;
  ticket_type: string;
  name: string;
  description: string;
  price: number;
  quantity_available: number;
  early_bird_end_date: string;
  is_active: boolean;
}

const eventSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  event_type: z.string().min(1, { message: 'Event type is required' }),
  start_time: z.date({ required_error: 'Start time is required' }),
  end_time: z.date({ required_error: 'End time is required' }),
  location: z.string().optional(),
  online_meeting_link: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  is_free: z.boolean().default(false),
  price: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  image_url: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const CreatorEventEdit = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const { user } = useAuth();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_type: 'webinar',
      start_time: new Date(),
      end_time: new Date(Date.now() + 3600000),
      is_free: true,
      price: 0,
      currency: 'USD',
    },
  });

  const { watch, setValue, reset } = form;
  const isFree = watch('is_free');

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!eventId) {
        setLoading(false);
        setInitialLoad(false);
        return;
      }
      
      try {
        const [
          { data: eventData, error: eventError },
          { data: ticketData, error: ticketError }
        ] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('event_tickets').select('*').eq('event_id', eventId)
        ]);
        
        if (eventError) throw eventError;
        
        const formattedEvent = {
          ...eventData,
          start_time: new Date(eventData.start_time),
          end_time: new Date(eventData.end_time),
          capacity: eventData.capacity || undefined,
          price: eventData.price || 0,
        };

        reset(formattedEvent);

        if (eventData.image_url) {
          setImagePreview(eventData.image_url);
        }
        
        if (!ticketError && ticketData) {
          setTicketTypes(ticketData);
        }

      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load event data');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [eventId, reset]);

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: `temp_${Date.now()}`,
      ticket_type: 'standard',
      name: '',
      description: '',
      price: 0,
      quantity_available: 100,
      early_bird_end_date: '',
      is_active: true
    };
    setTicketTypes(prev => [...prev, newTicket]);
  };

  const updateTicketType = (index: number, field: string, value: any) => {
    setTicketTypes(prev => prev.map((ticket, i) => 
      i === index ? { ...ticket, [field]: value } : ticket
    ));
  };

  const removeTicketType = (index: number) => {
    setTicketTypes(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('image_url', '');
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.getValues('image_url') || null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    if (!user || !eventId) {
      toast.error('You must be logged in to edit an event');
      return;
    }
    
    setLoading(true);
    try {
      const imageUrl = await uploadImage();

      const eventData = {
        ...values,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        price: values.is_free ? null : values.price,
        currency: values.is_free ? null : values.currency,
        image_url: imageUrl,
      };

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);
        
      if (error) throw error;

      if (!values.is_free && ticketTypes.length > 0) {
        await supabase
          .from('event_tickets')
          .delete()
          .eq('event_id', eventId);

        const ticketData = ticketTypes.map(ticket => ({
          event_id: eventId,
          ticket_type: ticket.ticket_type,
          name: ticket.name,
          description: ticket.description,
          price: ticket.price,
          quantity_available: ticket.quantity_available,
          quantity_sold: 0,
          early_bird_end_date: ticket.early_bird_end_date || null,
          is_active: ticket.is_active
        }));

        const { error: ticketsError } = await supabase
          .from('event_tickets')
          .insert(ticketData);

        if (ticketsError) throw ticketsError;
      }
      
      toast.success('Event updated successfully');
      navigate('/creator/events');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <CreatorLayout title="Edit Event">
        <Card>
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>Loading event details...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Edit Event">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>Update your event details below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Rest of your form fields with disabled={loading} added to inputs */}
              {/* ... */}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/creator/events')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Event'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorEventEdit;
