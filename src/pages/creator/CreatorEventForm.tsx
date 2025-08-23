import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  createEventWithCreator, 
  fetchEventById,
  VALID_EVENT_TYPES 
} from '@/services/eventService';
import { fetchUserWorkplaces, type UserWorkplace } from '@/services/workplaceService';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const CreatorEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    location: '',
    event_type: 'webinar',
    image_url: '',
    price: 0,
    is_free: true,
    currency: 'USD',
    capacity: 100,
    online_meeting_link: '',
    is_published: false
  });
  const [loading, setLoading] = useState(false);

  const [workplaces, setWorkplaces] = useState<UserWorkplace[]>([]);
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('');

  useEffect(() => {
    loadWorkplaces();
    if (isEdit && id) {
      loadEvent();
    }
  }, [isEdit, id]);

  const loadWorkplaces = async () => {
    const userWorkplaces = await fetchUserWorkplaces();
    setWorkplaces(userWorkplaces);
  };

  const loadEvent = async () => {
    if (!id) return;
    
    try {
      const event = await fetchEventById(id);
      if (event) {
        setFormData({
          title: event.title,
          description: event.description,
          start_time: new Date(event.start_time).toISOString().slice(0, 16),
          end_time: new Date(event.end_time).toISOString().slice(0, 16),
          location: event.location,
          event_type: event.event_type,
          image_url: event.image_url || '',
          price: event.price || 0,
          is_free: event.is_free,
          currency: event.currency || 'USD',
          capacity: event.capacity || 100,
          online_meeting_link: event.online_meeting_link || '',
          is_published: event.is_published || false
        });
        setSelectedWorkspace(event.workplace_id || '');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create an event');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        workplace_id: selectedWorkplace || null,
        price: formData.is_free ? 0 : formData.price,
        currency: formData.is_free ? null : (formData.currency || 'USD')
      };

      if (isEdit && id) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Event updated successfully');
      } else {
        await createEventWithCreator(eventData, user.id);
        toast.success('Event created successfully');
      }
      
      navigate('/creator/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/creator/events')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workspace Selection */}
            <div className="space-y-2">
              <Label htmlFor="workplace">
                <Building2 className="h-4 w-4 inline mr-2" />
                Workspace (Optional)
              </Label>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workspace or leave empty for personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Personal (No Workspace)</SelectItem>
                  {workplaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <span>{workspace.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {workspace.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Assign this event to a workspace to allow collaborative editing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event type" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_free">Is Free</Label>
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
              />
            </div>

            {!formData.is_free && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder="Event price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                placeholder="Event capacity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="online_meeting_link">Online Meeting Link</Label>
              <Input
                id="online_meeting_link"
                type="url"
                value={formData.online_meeting_link}
                onChange={(e) => setFormData({ ...formData, online_meeting_link: e.target.value })}
                placeholder="Online meeting link"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_published">Publish Event</Label>
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/creator/events')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatorEventForm;
