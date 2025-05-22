
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from 'sonner';
import { format, addHours } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import FileUpload from "@/components/common/FileUpload";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { VALID_EVENT_TYPES } from "@/services/eventService";

// Define event form schema
const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  event_type: z.string().min(1, { message: "Event type is required" }),
  start_time: z.string().min(1, { message: "Start time is required" }),
  end_time: z.string().min(1, { message: "End time is required" }),
  location: z.string().optional(),
  online_meeting_link: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  is_free: z.boolean().default(true),
  price: z.coerce.number().optional(),
  currency: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  isCreator?: boolean;
  creatorId?: string;
}

const EventForm = ({ isCreator = false, creatorId }: EventFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePath, setImagePath] = useState<string>("");

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      event_type: "",
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      location: "",
      online_meeting_link: "",
      capacity: 100,
      is_free: true,
      price: 0,
      currency: "USD",
    },
  });

  // Load event data if editing
  useEffect(() => {
    if (id) {
      const loadEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            // Convert dates to ISO string format for input elements
            const startTime = format(new Date(data.start_time), "yyyy-MM-dd'T'HH:mm");
            const endTime = format(new Date(data.end_time), "yyyy-MM-dd'T'HH:mm");
            
            // Populate form with existing data
            form.reset({
              title: data.title,
              description: data.description || "",
              event_type: data.event_type || "",
              start_time: startTime,
              end_time: endTime,
              location: data.location || "",
              online_meeting_link: data.online_meeting_link || "",
              capacity: data.capacity || undefined,
              is_free: data.is_free !== undefined ? data.is_free : true,
              price: data.price || 0,
              currency: data.currency || "USD",
            });
            
            if (data.image_url) {
              setImageUrl(data.image_url);
            }
          }
        } catch (error) {
          console.error('Error loading event:', error);
          toast.error("Failed to load event data");
        } finally {
          setLoading(false);
        }
      };

      loadEvent();
    }
  }, [id, form]);

  const onSubmit = async (values: EventFormValues) => {
    setLoading(true);
    try {
      // If it's free, set price to 0
      if (values.is_free) {
        values.price = 0;
        values.currency = null;
      }

      // Create complete event data object with all required fields
      const eventData = {
        title: values.title,
        description: values.description,
        event_type: values.event_type,
        start_time: values.start_time,
        end_time: values.end_time,
        location: values.location || null,
        online_meeting_link: values.online_meeting_link || null,
        capacity: values.capacity || null,
        is_free: values.is_free,
        price: values.is_free ? null : values.price,
        currency: values.is_free ? null : values.currency,
        image_url: imageUrl || null,
        creator_id: isCreator ? creatorId : null,
      };

      let result;

      if (id) {
        // Update existing event
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success("Event created successfully");
      }

      // Redirect after success
      if (isCreator) {
        navigate('/creator/events');
      } else {
        navigate('/admin/events');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error("Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (url: string, path: string) => {
    setImageUrl(url);
    setImagePath(path);
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="title"
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
                      placeholder="Detailed description of the event" 
                      className="min-h-[120px]" 
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
                        {VALID_EVENT_TYPES.map(type => (
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
                      <Input type="number" min="0" {...field} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Physical event location" {...field} />
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
                    <FormLabel>Meeting Link (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Zoom/Meet link for virtual events" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Event Image Upload */}
            <div className="space-y-2">
              <FormLabel>Event Image</FormLabel>
              <FileUpload
                bucket="event_images"
                accept="image/*"
                maxSize={2}
                onUploadComplete={handleImageUpload}
                existingUrl={imageUrl}
                label="Upload Event Image"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="is_free"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Free Event</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Set this event as free for all attendees
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!form.watch("is_free") && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
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
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
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
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(isCreator ? '/creator/events' : '/admin/events')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {id ? 'Update Event' : 'Create Event'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default EventForm;
