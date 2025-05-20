
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Event, VALID_EVENT_TYPES, createEventWithCreator } from '@/services/eventService';

interface EventFormProps {
  isCreator?: boolean;
  creatorId?: string;
}

const EventForm = ({ isCreator = false, creatorId }: EventFormProps) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const isEditing = !!eventId;

  // State for form fields
  const [event, setEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    event_type: 'workshop',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Default 2 hours later
    is_free: true,
    price: 0,
    currency: 'USD'
  });

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load event data if editing
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setEvent(data);
          
          // Parse dates
          const startDateTime = new Date(data.start_time);
          const endDateTime = new Date(data.end_time);
          
          setStartDate(startDateTime);
          setEndDate(endDateTime);
          
          // Format times
          setStartTime(format(startDateTime, 'HH:mm'));
          setEndTime(format(endDateTime, 'HH:mm'));
        }
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event data');
      }
    };
    
    fetchEvent();
  }, [eventId]);

  // Handle time changes
  useEffect(() => {
    if (startDate) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const newStartDate = new Date(startDate);
      newStartDate.setHours(hours, minutes, 0, 0);
      setEvent(prev => ({ ...prev, start_time: newStartDate.toISOString() }));
    }
    
    if (endDate) {
      const [hours, minutes] = endTime.split(':').map(Number);
      const newEndDate = new Date(endDate);
      newEndDate.setHours(hours, minutes, 0, 0);
      setEvent(prev => ({ ...prev, end_time: newEndDate.toISOString() }));
    }
  }, [startDate, endDate, startTime, endTime]);

  // Handle form field changes
  const handleChange = (field: keyof Event, value: any) => {
    setEvent(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validate dates
      if (new Date(event.start_time!) > new Date(event.end_time!)) {
        toast.error('End time must be after start time');
        setSubmitting(false);
        return;
      }
      
      // Get current user from auth context
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Not authenticated');
        setSubmitting(false);
        return;
      }
      
      // Process image upload if present
      let imageUrl = event.image_url;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        // Generate unique filename using UUID and timestamp
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        // Upload to the event-images bucket
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        // Get the public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);
          
        imageUrl = urlData.publicUrl;
      }
      
      const eventData = {
        ...event,
        image_url: imageUrl
      };
      
      if (isEditing && eventId) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
          
        if (error) throw error;
        
        toast.success('Event updated successfully');
        navigate(isCreator ? '/creator/events' : '/admin/events');
      } else {
        // Create new event
        // Use the passed creatorId or current user's ID
        const effectiveCreatorId = creatorId || userData.user.id;

        const newEvent = await createEventWithCreator(eventData, effectiveCreatorId);
        
        if (newEvent) {
          toast.success('Event created successfully');
          navigate(isCreator ? '/creator/events' : '/admin/events');
        }
      }
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Error saving event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Event' : 'Create Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={event.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={event.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter event description"
                rows={4}
              />
            </div>
            
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select 
                value={event.event_type} 
                onValueChange={(value) => handleChange('event_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date and Time Section */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Start Date and Time */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="mt-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              
              {/* End Date and Time */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="mt-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={event.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter event location"
              />
            </div>
            
            {/* Online Meeting Link */}
            <div className="space-y-2">
              <Label htmlFor="online_meeting_link">Online Meeting Link</Label>
              <Input
                id="online_meeting_link"
                value={event.online_meeting_link || ''}
                onChange={(e) => handleChange('online_meeting_link', e.target.value)}
                placeholder="Enter online meeting link"
              />
            </div>
            
            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={event.capacity || ''}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || undefined)}
                placeholder="Enter maximum capacity"
              />
            </div>
            
            {/* Price Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_free"
                  checked={event.is_free}
                  onCheckedChange={(checked) => {
                    handleChange('is_free', checked);
                    if (checked) {
                      handleChange('price', 0);
                    }
                  }}
                />
                <Label htmlFor="is_free">Free Event</Label>
              </div>
              
              {!event.is_free && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={event.price || 0}
                      onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={event.currency || 'USD'} 
                      onValueChange={(value) => handleChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              <Input
                id="image"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
              {event.image_url && (
                <div className="mt-2">
                  <img 
                    src={event.image_url} 
                    alt="Event" 
                    className="max-h-48 rounded-md" 
                  />
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating Event...' : 'Creating Event...'}
                </span>
              ) : (
                isEditing ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventForm;
