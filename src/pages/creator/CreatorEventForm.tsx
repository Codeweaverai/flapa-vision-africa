import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Upload, X } from 'lucide-react';
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
import { VALID_EVENT_TYPES, createEventWithCreator, Event } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';

// Define the form schema
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

const CreatorEventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [initialEvent, setInitialEvent] = useState<Event | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user } = useAuth();

  // Initialize form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_type: 'webinar',
      start_time: new Date(),
      end_time: new Date(Date.now() + 3600000), // Default 1 hour later
      is_free: true,
      price: 0,
      currency: 'USD',
    },
  });

  const { watch, setValue } = form;
  const isFree = watch('is_free');

  // Fetch event data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          
          setInitialEvent(data);
          
          // Format dates
          const event = {
            ...data,
            start_time: new Date(data.start_time),
            end_time: new Date(data.end_time),
            capacity: data.capacity || undefined,
            price: data.price || 0,
          };
          
          // Set form values
          Object.entries(event).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              setValue(key as any, value);
            }
          });

          if (data.image_url) {
            setImagePreview(data.image_url);
          }
        } catch (error) {
          console.error('Error fetching event:', error);
          toast.error('Failed to load event data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [id, isEditing, setValue]);

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
    if (!user) {
      toast.error('You must be logged in to create or edit an event');
      return;
    }
    
    setLoading(true);
    try {
      // Upload image if provided
      const imageUrl = await uploadImage();

      // Prepare event data
      const eventData = {
        ...values,
        // Convert Date objects to ISO strings
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        price: values.is_free ? null : values.price,
        currency: values.is_free ? null : values.currency,
        image_url: imageUrl,
      };

      if (isEditing && id) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success('Event updated successfully');
      } else {
        // Create new event
        const result = await createEventWithCreator({
          ...eventData,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
        }, user.id);
        
        if (!result) {
          throw new Error('Failed to create event');
        }
        
        toast.success('Event created successfully');
      }
      
      // Navigate back to events list
      navigate('/creator/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} event`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorLayout title={isEditing ? "Edit Event" : "Create New Event"}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your event details below' 
              : 'Enter the details for your new event'}
          </CardDescription>
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
                        placeholder="Provide a description of your event" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Image Upload */}
              <div>
                <Label htmlFor="image">Event Image</Label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Event image preview" 
                        className="max-h-48 rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="image" className="cursor-pointer">
                          <span className="text-sm text-gray-600">Click to upload event image</span>
                          <Input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    </div>
                  )}
                  
                  {!imagePreview && (
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VALID_EVENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder="Maximum number of attendees" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(!isNaN(value) ? value : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time*</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time*</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (For in-person events)</FormLabel>
                      <FormControl>
                        <Input placeholder="Event location" {...field} value={field.value || ''} />
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
                      <FormLabel>Online Meeting Link (For virtual events)</FormLabel>
                      <FormControl>
                        <Input placeholder="Zoom/Meet link" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_free"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Free Event</FormLabel>
                        <FormDescription>
                          Toggle if this is a free event or requires payment
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
                
                {!isFree && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="Event price" 
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(!isNaN(value) ? value : 0);
                              }}
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
                          <FormLabel>Currency*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value || 'USD'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              
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
                  {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorEventForm;
