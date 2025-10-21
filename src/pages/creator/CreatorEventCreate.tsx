import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Plus, Trash2, Calendar, MapPin, Link, Users, DollarSign, Ticket } from 'lucide-react';
import { toast } from 'sonner';

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

// Enhanced event categories with better icons
const EVENT_CATEGORIES = [
  { value: 'webinar', label: 'Webinar', icon: Users, color: 'from-blue-500 to-cyan-600' },
  { value: 'conferences', label: 'Conferences', icon: Users, color: 'from-purple-500 to-indigo-600' },
  { value: 'live-music', label: 'Live Music', icon: Users, color: 'from-pink-500 to-rose-600' },
  { value: 'sports-events', label: 'Sports Events', icon: Users, color: 'from-green-500 to-emerald-600' },
  { value: 'night-life', label: 'Night Life', icon: Users, color: 'from-purple-500 to-pink-600' },
  { value: 'concerts', label: 'Concerts', icon: Users, color: 'from-orange-500 to-red-600' },
  { value: 'comedy-shows', label: 'Comedy Shows', icon: Users, color: 'from-yellow-500 to-amber-600' },
  { value: 'business-events', label: 'Business Events', icon: Users, color: 'from-blue-500 to-indigo-600' },
  { value: 'wellness-events', label: 'Wellness Events', icon: Users, color: 'from-green-500 to-teal-600' },
  { value: 'summit', label: 'Summit', icon: Users, color: 'from-gray-500 to-blue-600' },
  { value: 'picnic', label: 'Picnic', icon: Users, color: 'from-green-500 to-lime-600' },
  { value: 'workshops', label: 'Workshops', icon: Users, color: 'from-purple-500 to-blue-600' },
  { value: 'festivals', label: 'Festivals', icon: Users, color: 'from-orange-500 to-yellow-600' },
  { value: 'gaming-events', label: 'Gaming Events', icon: Users, color: 'from-green-500 to-emerald-600' },
  { value: 'food-drink', label: 'Food & Drink', icon: Users, color: 'from-red-500 to-orange-600' },
  { value: 'art-exhibitions', label: 'Art Exhibitions', icon: Users, color: 'from-pink-500 to-purple-600' },
  { value: 'travel-events', label: 'Travel Events', icon: Users, color: 'from-blue-500 to-cyan-600' },
  { value: 'tech-meetups', label: 'Tech Meetups', icon: Users, color: 'from-blue-500 to-indigo-600' },
  { value: 'science-fairs', label: 'Science Fairs', icon: Users, color: 'from-purple-500 to-blue-600' },
  { value: 'cultural-events', label: 'Cultural Events', icon: Users, color: 'from-amber-500 to-orange-600' },
  { value: 'auto-shows', label: 'Auto Shows', icon: Users, color: 'from-gray-500 to-red-600' },
  { value: 'science-events', label: 'Science Events', icon: Users, color: 'from-purple-500 to-pink-600' },
  { value: 'community-events', label: 'Community Events', icon: Users, color: 'from-green-500 to-blue-600' }
];

const CreatorEventCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

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

  const removeImage = () => {
    setImagePreview(null);
    handleInputChange('image_url', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create an event');
      return;
    }

    if (!formData.title || !formData.description || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

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
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location || null,
        online_meeting_link: formData.online_meeting_link || null,
        capacity: formData.capacity,
        is_free: formData.is_free,
        price: formData.is_free ? 0 : formData.price,
        currency: formData.currency,
        image_url: formData.image_url || null,
        creator_id: user.id,
        is_published: true
      };

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) throw eventError;

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
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorLayout title="Create Event">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Enhanced Header Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-pink-600 p-1">
              <CardHeader className="bg-white/95 text-center pb-6 pt-8">
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  Create New Event
                </CardTitle>
                <p className="text-lg text-gray-600 font-medium">
                  Share your amazing event with the world
                </p>
              </CardHeader>
            </div>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Enhanced Event Categories Section */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-orange-500" />
                    Event Category *
                  </Label>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {EVENT_CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleInputChange('event_type', category.value)}
                          className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold transition-all duration-300 flex-shrink-0 min-w-max ${
                            formData.event_type === category.value
                              ? `bg-gradient-to-r ${category.color} text-white shadow-2xl transform scale-105 ring-2 ring-white/50`
                              : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-xl border border-gray-200/60 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Enhanced Basic Info */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2" htmlFor="title">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        Event Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter an engaging event title"
                        className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold" htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe what attendees can expect from your event..."
                        rows={6}
                        className="bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl resize-none text-base transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Enhanced Event Image Upload */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Event Image</Label>
                      <div className="space-y-4">
                        {imagePreview ? (
                          <div className="relative inline-block group">
                            <img 
                              src={imagePreview} 
                              alt="Event image preview" 
                              className="max-h-64 rounded-2xl border-2 border-gray-200 shadow-lg transition-transform duration-300 group-hover:scale-105"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-9 w-9 bg-gradient-to-r from-red-500 to-pink-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
                              onClick={removeImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-white/50 hover:bg-white transition-all duration-300 group cursor-pointer">
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center shadow-lg">
                                <Upload className="h-8 w-8 text-white" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="image" className="cursor-pointer">
                                  <span className="text-base font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                                    Click to upload event image
                                  </span>
                                  <Input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </Label>
                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {uploadingImage && (
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Uploading image...
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Enhanced Details */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center gap-2" htmlFor="capacity">
                          <Users className="h-5 w-5 text-orange-500" />
                          Capacity
                        </Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                          min="1"
                          className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold" htmlFor="start_time">Start Time *</Label>
                          <Input
                            id="start_time"
                            type="datetime-local"
                            value={formData.start_time}
                            onChange={(e) => handleInputChange('start_time', e.target.value)}
                            className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-semibold" htmlFor="end_time">End Time *</Label>
                          <Input
                            id="end_time"
                            type="datetime-local"
                            value={formData.end_time}
                            onChange={(e) => handleInputChange('end_time', e.target.value)}
                            className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center gap-2" htmlFor="location">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          Location (For in-person events)
                        </Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Enter event venue or address"
                          className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center gap-2" htmlFor="online_meeting_link">
                          <Link className="h-5 w-5 text-orange-500" />
                          Online Meeting Link (For virtual events)
                        </Label>
                        <Input
                          id="online_meeting_link"
                          value={formData.online_meeting_link}
                          onChange={(e) => handleInputChange('online_meeting_link', e.target.value)}
                          placeholder="https://zoom.us/j/..."
                          className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Pricing Section */}
                <div className="space-y-6">
                  <div className="flex flex-row items-center justify-between rounded-2xl border-2 border-gray-200 p-6 bg-white/80 backdrop-blur-sm shadow-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-orange-500" />
                        Free Event
                      </Label>
                      <p className="text-gray-600 text-sm">
                        Toggle if this is a free event or requires payment
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_free}
                      onCheckedChange={(checked) => {
                        handleInputChange('is_free', checked);
                        if (checked) {
                          setTicketTypes([]);
                        }
                      }}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-purple-600 h-6 w-11"
                    />
                  </div>
                  
                  {!formData.is_free && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold" htmlFor="price">Base Price (for fallback)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold" htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                          <SelectTrigger className="h-12 bg-white/80 border-2 border-gray-200 focus:border-orange-500 rounded-xl text-lg font-medium transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
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
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Ticket Types Section */}
                {!formData.is_free && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                          Ticket Types
                        </Label>
                        <p className="text-gray-600 mt-1">Create different ticket options for your event</p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={addTicketType} 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3 rounded-xl font-semibold"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Ticket Type
                      </Button>
                    </div>

                    {ticketTypes.map((ticket, index) => (
                      <Card key={ticket.id} className="p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl rounded-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="space-y-2">
                            <Label className="font-semibold">Ticket Name *</Label>
                            <Input
                              value={ticket.name}
                              onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                              placeholder="e.g., Early Bird, VIP, Standard"
                              className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl transition-all duration-300"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="font-semibold">Ticket Type</Label>
                            <Select 
                              value={ticket.ticket_type} 
                              onValueChange={(value) => updateTicketType(index, 'ticket_type', value)}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl transition-all duration-300">
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
                              className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl transition-all duration-300"
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
                              className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl transition-all duration-300"
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
                              className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl transition-all duration-300"
                            />
                          </div>

                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3 rounded-xl font-semibold"
                              onClick={() => removeTicketType(index)}
                            >
                              <Trash2 className="h-5 w-5 mr-2" />
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
                            className="bg-white border-2 border-gray-200 focus:border-orange-500 rounded-xl resize-none transition-all duration-300"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Enhanced Action Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/creator/events')}
                    disabled={loading}
                    className="h-12 px-8 border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || uploadingImage}
                    className="h-12 px-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-semibold hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Creating Event...
                      </>
                    ) : (
                      'Create Event'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorEventCreate;
