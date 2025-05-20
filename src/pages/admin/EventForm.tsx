import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, ArrowLeft, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { Event } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { createEventWithCreator } from '@/services/eventService';

// Define a type for the form values
type FormValues = z.infer<typeof formSchema>;

// Define a type for creating a new event
interface NewEvent {
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
  online_meeting_link: string | null;
  capacity: number | null;
  is_free: boolean;
  price: number | null;
  currency: string | null;
}

interface EventFormProps {
  isCreator?: boolean;
  creatorId?: string;
}

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  event_type: z.string().min(2, { message: 'Event type is required.' }),
  start_time: z.date(),
  end_time: z.date(),
  location: z.string().optional(),
  online_meeting_link: z.string().url().optional().or(z.literal('')),
  capacity: z.number().int().positive().optional(),
  is_free: z.boolean().default(true),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
});

const EventForm = ({ isCreator = false, creatorId }: EventFormProps) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      event_type: 'workshop',
      start_time: new Date(),
      end_time: new Date(),
      location: '',
      online_meeting_link: '',
      capacity: 20,
      is_free: true,
      price: 0,
      currency: 'USD',
    },
  });

  useEffect(() => {
    if (eventId) {
      const loadEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setEvent(data as Event);
            form.reset({
              title: data.title,
              description: data.description || '',
              event_type: data.event_type,
              start_time: new Date(data.start_time),
              end_time: new Date(data.end_time),
              location: data.location || '',
              online_meeting_link: data.online_meeting_link || '',
              capacity: data.capacity || undefined,
              is_free: data.is_free,
              price: data.is_free ? 0 : data.price,
              currency: data.currency || 'USD',
            });
            
            if (data.image_url) {
              setImagePreview(data.image_url);
            }
          }
        } catch (error) {
          console.error('Error loading event:', error);
          toast.error('Failed to load event details');
        } finally {
          setLoading(false);
        }
      };
      
      loadEvent();
    }
  }, [eventId, form]);

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create or edit events');
      return;
    }
    
    setLoading(true);
    try {
      let eventResult: Event | null = null;
      
      if (eventId) {
        // Update existing event
        const { data: updatedEvent, error } = await supabase
          .from('events')
          .update({
            title: data.title,
            description: data.description,
            event_type: data.event_type,
            start_time: data.start_time.toISOString(),
            end_time: data.end_time.toISOString(),
            location: data.location || null,
            online_meeting_link: data.online_meeting_link || null,
            capacity: data.capacity || null,
            is_free: data.is_free,
            price: data.is_free ? null : data.price,
            currency: data.is_free ? null : data.currency,
          })
          .eq('id', eventId)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating event:', error);
          toast.error(`Failed to update event: ${error.message}`);
          throw error;
        }
        
        eventResult = updatedEvent as Event;
        toast.success('Event updated successfully!');
      } else {
        // Create new event
        const newEventData: NewEvent = {
          title: data.title,
          description: data.description,
          event_type: data.event_type,
          start_time: data.start_time.toISOString(),
          end_time: data.end_time.toISOString(),
          location: data.location || null,
          online_meeting_link: data.online_meeting_link || null,
          capacity: data.capacity || null,
          is_free: data.is_free,
          price: data.is_free ? null : (data.price || 0),
          currency: data.is_free ? null : (data.currency || 'USD'),
        };
        
        console.log('Creating new event with data:', newEventData);
        
        if (isCreator) {
          // Use the provided creatorId for creator or fall back to the current user's id
          const effectiveCreatorId = creatorId || user.id;
          console.log('Creating event as creator with ID:', effectiveCreatorId);
          eventResult = await createEventWithCreator(newEventData, effectiveCreatorId);
          if (!eventResult) {
            setLoading(false);
            return;
          }
        } else {
          // For admin
          try {
            const { data: createdEvent, error } = await supabase
              .from('events')
              .insert([{
                ...newEventData,
                creator_id: user.id
              }])
              .select()
              .single();
              
            if (error) {
              console.error('Admin event creation error:', error);
              toast.error(`Failed to create event: ${error.message}`);
              throw error;
            }
            
            eventResult = createdEvent as Event;
            toast.success('Event created successfully!');
          } catch (error: any) {
            console.error('Error in admin event creation:', error);
            toast.error(`Failed to create event: ${error.message || 'Unknown error'}`);
            setLoading(false);
            return;
          }
        }
      }
      
      if (eventResult && image) {
        setUploadingImage(true);
        try {
          const fileExt = image.name.split('.').pop();
          const fileName = `${eventResult.id}-image.${fileExt}`;
          const filePath = `events/${fileName}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('public')
            .upload(filePath, image, { upsert: true });
          
          if (uploadError) throw uploadError;
          
          const { data } = supabase
            .storage
            .from('public')
            .getPublicUrl(filePath);
          
          if (data) {
            const { error: updateError } = await supabase
              .from('events')
              .update({ image_url: data.publicUrl })
              .eq('id', eventResult.id);
            
            if (updateError) throw updateError;
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload event image');
        } finally {
          setUploadingImage(false);
        }
      }
      
      navigate(isCreator ? '/creator/events' : '/admin/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(`Failed to save event: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImage(file);
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ensure we have valid event types that match the database constraints
  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'conference', label: 'Conference' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' },
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'ZMW', label: 'Zambian Kwacha (ZMW)' },
  ];

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(isCreator ? '/creator/events' : '/admin/events')} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{eventId ? 'Edit Event' : 'Create New Event'}</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Introduction to Digital Marketing" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed description of the event, what attendees can expect, etc." 
                                {...field}
                                rows={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="event_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {eventTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="start_time"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date & Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP HH:mm")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                  <div className="p-3 border-t border-border">
                                    <Input
                                      type="time"
                                      value={format(field.value, "HH:mm")}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':');
                                        const newDate = new Date(field.value);
                                        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                        field.onChange(newDate);
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="end_time"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date & Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP HH:mm")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                  <div className="p-3 border-t border-border">
                                    <Input
                                      type="time"
                                      value={format(field.value, "HH:mm")}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':');
                                        const newDate = new Date(field.value);
                                        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                        field.onChange(newDate);
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location (optional for in-person events)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. City Conference Center" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="online_meeting_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Online Meeting Link (optional for virtual events)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. https://zoom.us/j/123456789" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value || ''} 
                                onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="is_free"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Free Event</FormLabel>
                              <FormMessage />
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {!form.watch('is_free') && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field} 
                                    value={field.value === undefined ? '' : field.value} 
                                    onChange={e => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {currencies.map((currency) => (
                                      <SelectItem key={currency.value} value={currency.value}>
                                        {currency.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Event Image</h3>
                        <div className="border rounded-md aspect-video bg-muted flex items-center justify-center overflow-hidden">
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Event image preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">Upload event image</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor="image">Upload Image</Label>
                          <Input
                            id="image"
                            type="file"
                            className="mt-1"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended size: 1200x675px (16:9)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || uploadingImage}
                    >
                      {(loading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {eventId ? 'Update Event' : 'Create Event'}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default EventForm;
