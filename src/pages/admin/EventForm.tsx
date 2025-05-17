
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/services/eventService';

type EventFormValues = {
  title: string;
  description: string;
  event_type: 'webinar' | 'in-person' | 'mentorship';
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  is_free: boolean;
  price?: number;
  currency: string;
  image?: File | null;
};

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<EventFormValues>({
    defaultValues: {
      title: '',
      description: '',
      event_type: 'webinar',
      start_time: '',
      end_time: '',
      location: '',
      online_meeting_link: '',
      capacity: undefined,
      is_free: true,
      price: 0,
      currency: 'ZMW',
      image: null,
    },
  });
  
  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const event = data as Event;
        
        // Format date values for datetime-local input
        const formatDateForInput = (dateString: string) => {
          try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16); // Format as yyyy-MM-ddThh:mm
          } catch (error) {
            return '';
          }
        };
        
        form.reset({
          title: event.title,
          description: event.description || '',
          event_type: event.event_type as 'webinar' | 'in-person' | 'mentorship',
          start_time: formatDateForInput(event.start_time),
          end_time: formatDateForInput(event.end_time),
          location: event.location || '',
          online_meeting_link: event.online_meeting_link || '',
          capacity: event.capacity || undefined,
          is_free: event.is_free || false,
          price: event.price || 0,
          currency: event.currency || 'ZMW',
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    setSubmitting(true);
    try {
      // Handle image upload if there's a file
      let imagePath = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `event-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);
        
        imagePath = publicUrlData.publicUrl;
      }
      
      // Convert values to match Event type
      const eventData: any = {
        title: values.title,
        description: values.description,
        event_type: values.event_type,
        start_time: new Date(values.start_time).toISOString(),
        end_time: new Date(values.end_time).toISOString(),
        location: values.location || null,
        online_meeting_link: values.online_meeting_link || null,
        capacity: values.capacity || null,
        is_free: values.is_free,
        price: values.is_free ? null : values.price,
        currency: values.currency,
      };
      
      if (imagePath) {
        eventData.image_url = imagePath;
      }
      
      if (id) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Event updated successfully');
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) throw error;
        toast.success('Event created successfully');
      }
      
      // Navigate back to events list
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <AdminLayout title="Loading Event...">
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? "Edit Event" : "Create New Event"}>
      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    rules={{ required: 'Title is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event title" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter event description" 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="event_type"
                      rules={{ required: 'Event type is required' }}
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
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="webinar">Online Webinar</SelectItem>
                              <SelectItem value="in-person">In-Person Event</SelectItem>
                              <SelectItem value="mentorship">Mentorship Session</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-6">
                      {form.watch('event_type') === 'in-person' && (
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Event location" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {form.watch('event_type') === 'webinar' && (
                        <FormField
                          control={form.control}
                          name="online_meeting_link"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Online Meeting Link</FormLabel>
                              <FormControl>
                                <Input placeholder="https://meet.google.com/..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="start_time"
                      rules={{ required: 'Start time is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_time"
                      rules={{ required: 'End time is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Capacity (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Leave blank for unlimited"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of attendees allowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="is_free"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Free Event
                            </FormLabel>
                            <FormDescription>
                              Toggle if this event is free to attend
                            </FormDescription>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="price"
                          rules={{ 
                            required: !form.watch('is_free') ? 'Price is required for paid events' : false,
                            min: { value: 0, message: 'Price cannot be negative' }
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                  <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="image" className="block mb-2">
                      Event Image
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload an image for your event
                    </p>
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="max-h-64 rounded-md border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {id ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  id ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default EventForm;
