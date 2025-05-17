
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/services/eventService';
import AdminLayout from '@/components/layout/AdminLayout';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

// Event schema for validation
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  event_type: z.enum(['webinar', 'in-person', 'mentorship']),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  online_meeting_link: z.string().optional(),
  capacity: z.number().int().positive().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  currency: z.string().optional().nullable(),
  is_free: z.boolean().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    title: '',
    description: '',
    event_type: 'webinar',
    start_time: '',
    end_time: '',
    location: '',
    online_meeting_link: '',
    capacity: null,
    price: null,
    currency: 'ZMW',
    is_free: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Date helpers for the calendar component
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data);
          if (data && isEditing) {
            fetchEvent();
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isEditing, id]);

  const fetchEvent = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Convert dates for the form
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);
        
        setStartDate(start);
        setEndDate(end);
        setStartTime(format(start, 'HH:mm'));
        setEndTime(format(end, 'HH:mm'));
        
        // Set form data
        setFormData({
          title: data.title,
          description: data.description || '',
          event_type: data.event_type as 'webinar' | 'in-person' | 'mentorship',
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location || '',
          online_meeting_link: data.online_meeting_link || '',
          capacity: data.capacity,
          price: data.price,
          currency: data.currency || 'ZMW',
          is_free: data.is_free === null ? true : data.is_free,
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  // Update start_time when date or time changes
  useEffect(() => {
    if (startDate && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const newDate = new Date(startDate);
      newDate.setHours(hours, minutes);
      setFormData(prev => ({ 
        ...prev, 
        start_time: newDate.toISOString()
      }));
    }
  }, [startDate, startTime]);

  // Update end_time when date or time changes
  useEffect(() => {
    if (endDate && endTime) {
      const [hours, minutes] = endTime.split(':').map(Number);
      const newDate = new Date(endDate);
      newDate.setHours(hours, minutes);
      setFormData(prev => ({ 
        ...prev, 
        end_time: newDate.toISOString()
      }));
    }
  }, [endDate, endTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value ? Number(value) : null });
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
    
    // If is_free is checked, set price to null
    if (name === 'is_free' && checked) {
      setFormData(prev => ({ ...prev, price: null }));
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    try {
      eventSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setSaving(true);
    
    try {
      const eventData = { 
        ...formData,
        // Handle is_free correctly with null values
        price: formData.is_free ? null : formData.price,
        currency: formData.is_free ? null : formData.currency,
      };

      let response;
      
      if (isEditing && id) {
        // Update existing event
        response = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);
      } else {
        // Create new event
        response = await supabase
          .from('events')
          .insert([eventData]);
      }
      
      const { error } = response;
      
      if (error) {
        throw error;
      }
      
      toast.success(`Event ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} event`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isAdmin === false) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have admin permissions to access this page.
          </AlertDescription>
        </Alert>
        <p className="text-center my-8">
          Please contact the site administrator if you believe this is an error.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="events">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={validationErrors.title ? 'border-destructive' : ''}
              />
              {validationErrors.title && (
                <p className="text-xs text-destructive">{validationErrors.title}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => handleSelectChange('event_type', value)}
              >
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.event_type && (
                <p className="text-xs text-destructive">{validationErrors.event_type}</p>
              )}
            </div>
            
            {/* Start Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                        validationErrors.start_time && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={validationErrors.start_time ? 'border-destructive' : ''}
                />
              </div>
              {validationErrors.start_time && (
                <p className="text-xs text-destructive col-span-2">{validationErrors.start_time}</p>
              )}
            </div>
            
            {/* End Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                        validationErrors.end_time && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={validationErrors.end_time ? 'border-destructive' : ''}
                />
              </div>
              {validationErrors.end_time && (
                <p className="text-xs text-destructive col-span-2">{validationErrors.end_time}</p>
              )}
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                placeholder={formData.event_type === 'webinar' ? 'Online' : 'Physical location'}
              />
            </div>
            
            {/* Online Meeting Link */}
            {(formData.event_type === 'webinar' || formData.event_type === 'mentorship') && (
              <div className="space-y-2">
                <Label htmlFor="online_meeting_link">Online Meeting Link</Label>
                <Input
                  id="online_meeting_link"
                  name="online_meeting_link"
                  value={formData.online_meeting_link || ''}
                  onChange={handleInputChange}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}
            
            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity === null ? '' : formData.capacity}
                onChange={handleNumberChange}
                placeholder="Maximum number of attendees"
              />
            </div>
            
            {/* Is Free Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => handleCheckboxChange('is_free', checked as boolean)}
              />
              <Label htmlFor="is_free" className="cursor-pointer">This is a free event</Label>
            </div>
            
            {/* Price and Currency (if not free) */}
            {!formData.is_free && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price === null ? '' : formData.price}
                    onChange={handleNumberChange}
                    placeholder="0.00"
                    className={validationErrors.price ? 'border-destructive' : ''}
                  />
                  {validationErrors.price && (
                    <p className="text-xs text-destructive">{validationErrors.price}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency || 'ZMW'}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZMW">ZMW (Zambian Kwacha)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EventForm;
