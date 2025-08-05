
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Upload, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Valid event types from the database constraint
const VALID_EVENT_TYPES = [
  'webinar',
  'workshop', 
  'conference',
  'meetup',
  'seminar',
  'training',
  'mentorship',
  'networking'
];

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

const CreatorEventCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'webinar',
    start_time: '',
    end_time: '',
    location: '',
    online_meeting_link: '',
    capacity: 50,
    is_free: true,
    price: 0,
    currency: 'USD',
    image_url: ''
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `event-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      handleInputChange('image_url', publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create an event');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(formData.event_type)) {
      toast.error('Please select a valid event type');
      return;
    }

    // Validate date/time
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      toast.error('End time must be after start time');
      return;
    }

    // Validate ticket types for paid events
    if (!formData.is_free && ticketTypes.length === 0) {
      toast.error('Please add at least one ticket type for paid events');
      return;
    }

    // Validate ticket types data
    for (const ticket of ticketTypes) {
      if (!ticket.name || ticket.price < 0 || ticket.quantity_available <= 0) {
        toast.error('Please fill in all ticket type details correctly');
        return;
      }
    }

    setLoading(true);
    
    try {
      // Create event with proper field mapping
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_type: formData.event_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location?.trim() || null,
        online_meeting_link: formData.online_meeting_link?.trim() || null,
        capacity: formData.capacity,
        is_free: formData.is_free,
        price: formData.is_free ? 0 : formData.price,
        currency: formData.currency,
        image_url: formData.image_url || null,
        creator_id: user.id
      };

      console.log('Creating event with data:', eventData);

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) {
        console.error('Event creation error:', eventError);
        throw eventError;
      }

      console.log('Event created successfully:', event);

      // Create ticket types if this is not a free event
      if (!formData.is_free && ticketTypes.length > 0) {
        const ticketData = ticketTypes.map(ticket => ({
          event_id: event.id,
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
          console.error('Error creating tickets:', ticketsError);
          toast.error('Event created but failed to create tickets');
        }
      }

      toast.success('Event created successfully');
      navigate('/creator/events');
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      // Provide more specific error messages
      if (error?.code === '23514') {
        toast.error('Please select a valid event type from the dropdown');
      } else if (error?.message?.includes('violates check constraint')) {
        toast.error('Please ensure all fields contain valid values');
      } else {
        toast.error('Failed to create event. Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorLayout title="Create Event">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select value={formData.event_type} onValueChange={(value) => handleInputChange('event_type', value)}>
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

              <div className="space-y-2">
                <Label htmlFor="start_time">Start Date & Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Date & Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Physical location (optional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="online_meeting_link">Online Meeting Link</Label>
              <Input
                id="online_meeting_link"
                value={formData.online_meeting_link}
                onChange={(e) => handleInputChange('online_meeting_link', e.target.value)}
                placeholder="Zoom, Teams, or other meeting link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('image')?.click()}
                  disabled={uploadingImage}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt="Event preview" 
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Pricing</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={formData.is_free}
                    onChange={(e) => {
                      handleInputChange('is_free', e.target.checked);
                      if (e.target.checked) {
                        setTicketTypes([]);
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="is_free">Free Event</Label>
                </div>
              </div>

              {!formData.is_free && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price">Base Price (for fallback)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ZMW">ZMW</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="ZAR">ZAR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Ticket Types Section */}
            {!formData.is_free && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Ticket Types</Label>
                  <Button type="button" onClick={addTicketType} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ticket Type
                  </Button>
                </div>

                {ticketTypes.map((ticket, index) => (
                  <Card key={ticket.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Ticket Name *</Label>
                        <Input
                          value={ticket.name}
                          onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                          placeholder="e.g., Early Bird, VIP, Standard"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ticket Type</Label>
                        <Select 
                          value={ticket.ticket_type} 
                          onValueChange={(value) => updateTicketType(index, 'ticket_type', value)}
                        >
                          <SelectTrigger>
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
                        <Label>Price *</Label>
                        <Input
                          type="number"
                          value={ticket.price}
                          onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity Available *</Label>
                        <Input
                          type="number"
                          value={ticket.quantity_available}
                          onChange={(e) => updateTicketType(index, 'quantity_available', parseInt(e.target.value) || 0)}
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Early Bird End Date (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={ticket.early_bird_end_date}
                          onChange={(e) => updateTicketType(index, 'early_bird_end_date', e.target.value)}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTicketType(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={ticket.description}
                        onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                        placeholder="What's included with this ticket?"
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/creator/events')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploadingImage}>
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorEventCreate;
