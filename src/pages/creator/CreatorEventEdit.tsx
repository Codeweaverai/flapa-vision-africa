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
import { Upload, X, Plus, Trash2, Calendar, BookOpen } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';

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

// Event categories with icons matching the mobile app
const EVENT_CATEGORIES = [
  { value: 'webinar', label: 'Webinar', icon: Calendar, color: 'from-blue-500 to-cyan-600' },
  { value: 'conferences', label: 'Conferences', icon: Calendar, color: 'from-purple-500 to-indigo-600' },
  { value: 'live-music', label: 'Live Music', icon: Calendar, color: 'from-pink-500 to-rose-600' },
  { value: 'sports-events', label: 'Sports Events', icon: Calendar, color: 'from-green-500 to-emerald-600' },
  { value: 'night-life', label: 'Night Life', icon: Calendar, color: 'from-purple-500 to-pink-600' },
  { value: 'concerts', label: 'Concerts', icon: Calendar, color: 'from-orange-500 to-red-600' },
  { value: 'comedy-shows', label: 'Comedy Shows', icon: Calendar, color: 'from-yellow-500 to-amber-600' },
  { value: 'business-events', label: 'Business Events', icon: Calendar, color: 'from-blue-500 to-indigo-600' },
  { value: 'wellness-events', label: 'Wellness Events', icon: Calendar, color: 'from-green-500 to-teal-600' },
  { value: 'summit', label: 'Summit', icon: Calendar, color: 'from-gray-500 to-blue-600' },
  { value: 'picnic', label: 'Picnic', icon: Calendar, color: 'from-green-500 to-lime-600' },
  { value: 'workshops', label: 'Workshops', icon: Calendar, color: 'from-purple-500 to-blue-600' },
  { value: 'festivals', label: 'Festivals', icon: Calendar, color: 'from-orange-500 to-yellow-600' },
  { value: 'gaming-events', label: 'Gaming Events', icon: Calendar, color: 'from-green-500 to-emerald-600' },
  { value: 'food-drink', label: 'Food & Drink', icon: Calendar, color: 'from-red-500 to-orange-600' },
  { value: 'art-exhibitions', label: 'Art Exhibitions', icon: Calendar, color: 'from-pink-500 to-purple-600' },
  { value: 'travel-events', label: 'Travel Events', icon: Calendar, color: 'from-blue-500 to-cyan-600' },
  { value: 'tech-meetups', label: 'Tech Meetups', icon: Calendar, color: 'from-blue-500 to-indigo-600' },
  { value: 'science-fairs', label: 'Science Fairs', icon: Calendar, color: 'from-purple-500 to-blue-600' },
  { value: 'cultural-events', label: 'Cultural Events', icon: Calendar, color: 'from-amber-500 to-orange-600' },
  { value: 'auto-shows', label: 'Auto Shows', icon: Calendar, color: 'from-gray-500 to-red-600' },
  { value: 'science-events', label: 'Science Events', icon: Calendar, color: 'from-purple-500 to-pink-600' },
  { value: 'community-events', label: 'Community Events', icon: Calendar, color: 'from-green-500 to-blue-600' }
];

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

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="flex flex-col items-center justify-center min-h-96">
        {/* Pulse Animation Container */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          {/* Outer Pulse Circle */}
          <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
          
          {/* Middle Pulse Circle */}
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
          
          {/* Inner Pulse Circle */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
          
          {/* Center Icon */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Calendar className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Loading Event Details
          </h3>
          <p className="text-muted-foreground text-lg">
            Preparing your event editor...
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-2 mt-6">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

const CreatorEventEdit = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const { user } = useAuth();

  // Initialize form
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

  const { watch, setValue } = form;
  const isFree = watch('is_free');

  // Fetch event data and ticket types
  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchTicketTypes();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      // Format dates and set form values
      const event = {
        ...data,
        start_time: new Date(data.start_time),
        end_time: new Date(data.end_time),
        capacity: data.capacity || undefined,
        price: data.price || 0,
      };
      
      Object.entries(event).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as any, value);
        }
      });

      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketTypes = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error) {
      console.error('Error fetching ticket types:', error);
    }
  };

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
    
    setSubmitting(true);
    try {
      // Upload image if provided
      const imageUrl = await uploadImage();

      // Prepare event data
      const eventData = {
        ...values,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        price: values.is_free ? null : values.price,
        currency: values.is_free ? null : values.currency,
        image_url: imageUrl,
      };

      // Update event
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);
        
      if (error) throw error;

      // Handle ticket types for paid events
      if (!values.is_free && ticketTypes.length > 0) {
        // Delete existing tickets
        await supabase
          .from('event_tickets')
          .delete()
          .eq('event_id', eventId);

        // Insert new tickets
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

        if (ticketsError) {
          console.error('Error updating tickets:', ticketsError);
          toast.error('Event updated but failed to update tickets');
        }
      }
      
      toast.success('Event updated successfully');
      navigate('/creator/events');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PulseLoading />;
  }

  return (
    <CreatorLayout title="Edit Event">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-6">
        <div className="container mx-auto px-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Edit Event
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Update your event details and make it even more amazing
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Event Categories Horizontal Scroll */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-gray-900">Event Category</Label>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {EVENT_CATEGORIES.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => setValue('event_type', category.value)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-shrink-0 ${
                            form.watch('event_type') === category.value
                              ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                              : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                          }`}
                        >
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Event Title*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter an engaging event title" 
                                className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                {...field} 
                              />
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
                            <FormLabel className="text-base font-semibold">Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what attendees can expect from your event..." 
                                className="min-h-[140px] bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Event Image Upload */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Event Image</Label>
                        <div className="space-y-4">
                          {imagePreview ? (
                            <div className="relative inline-block">
                              <img 
                                src={imagePreview} 
                                alt="Event image preview" 
                                className="max-h-48 rounded-xl border-2 border-gray-200 shadow-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-r from-red-500 to-pink-600 border-0 shadow-lg"
                                onClick={removeImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white/50 hover:bg-white transition-colors">
                              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <div className="space-y-2">
                                <Label htmlFor="image" className="cursor-pointer">
                                  <span className="text-base font-medium text-gray-700">Click to upload event image</span>
                                  <Input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                  />
                                </Label>
                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Capacity (optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Maximum number of attendees" 
                                  className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
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
                        
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={form.control}
                            name="start_time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold">Start Time*</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
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
                                <FormLabel className="text-base font-semibold">End Time*</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Location (For in-person events)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter event venue or address" 
                                  className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                  {...field} 
                                  value={field.value || ''} 
                                />
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
                              <FormLabel className="text-base font-semibold">Online Meeting Link (For virtual events)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://zoom.us/j/..." 
                                  className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                  {...field} 
                                  value={field.value || ''} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Pricing Section */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="is_free"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 border-gray-200 p-6 bg-white/80">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-semibold">Free Event</FormLabel>
                            <FormDescription className="text-gray-600">
                              Toggle if this is a free event or requires payment
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  setTicketTypes([]);
                                }
                              }}
                              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-purple-600"
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
                              <FormLabel className="text-base font-semibold">Base Price (for fallback)*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00" 
                                  className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
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
                              <FormLabel className="text-base font-semibold">Currency*</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value || 'USD'}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                  <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                                  <SelectItem value="XOF">XOF - West African CFA Franc</SelectItem>
                                  <SelectItem value="XAF">XAF - Central African CFA Franc</SelectItem>
                                  <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                                  <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                                  <SelectItem value="LSL">LSL - Lesotho Loti</SelectItem>
                                  <SelectItem value="MWK">MWK - Malawian Kwacha</SelectItem>
                                  <SelectItem value="MZN">MZN - Mozambican Metical</SelectItem>
                                  <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                                  <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                                  <SelectItem value="SLL">SLL - Sierra Leonean Leone</SelectItem>
                                  <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                                  <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Ticket Types Section */}
                  {!isFree && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                          Ticket Types
                        </Label>
                        <Button 
                          type="button" 
                          onClick={addTicketType} 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Ticket Type
                        </Button>
                      </div>

                      {ticketTypes.map((ticket, index) => (
                        <Card key={ticket.id} className="p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label className="font-semibold">Ticket Name *</Label>
                              <Input
                                value={ticket.name}
                                onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                                placeholder="e.g., Early Bird, VIP, Standard"
                                className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="font-semibold">Ticket Type</Label>
                              <Select 
                                value={ticket.ticket_type} 
                                onValueChange={(value) => updateTicketType(index, 'ticket_type', value)}
                              >
                                <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ordinary">Ordinary</SelectItem>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="vip">VIP</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="font-semibold">Price *</Label>
                              <Input
                                type="number"
                                value={ticket.price}
                                onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="font-semibold">Quantity Available *</Label>
                              <Input
                                type="number"
                                value={ticket.quantity_available}
                                onChange={(e) => updateTicketType(index, 'quantity_available', parseInt(e.target.value) || 0)}
                                min="1"
                                className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label className="font-semibold">Early Bird End Date (Optional)</Label>
                              <Input
                                type="datetime-local"
                                value={ticket.early_bird_end_date}
                                onChange={(e) => updateTicketType(index, 'early_bird_end_date', e.target.value)}
                                className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                              />
                            </div>

                            <div className="flex items-end justify-end">
                              <Button
                                type="button"
                                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                onClick={() => removeTicketType(index)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="font-semibold">Description</Label>
                            <Textarea
                              value={ticket.description}
                              onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                              placeholder="What's included with this ticket? Any special benefits or features?"
                              rows={3}
                              className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl resize-none"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/creator/events')}
                      disabled={submitting}
                      className="h-12 px-8 border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 rounded-xl font-semibold transition-all duration-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="h-12 px-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating Event...
                        </>
                      ) : (
                        'Update Event'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorEventEdit;
