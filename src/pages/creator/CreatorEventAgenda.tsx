
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { 
  EventAgenda, 
  KeynoteSpeaker, 
  fetchEventAgenda, 
  fetchEventSpeakers,
  createAgendaItem, 
  updateAgendaItem, 
  deleteAgendaItem 
} from '@/services/eventManagementService';

const CreatorEventAgenda = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState<EventAgenda[]>([]);
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventAgenda | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    speaker_id: '',
    location: '',
    session_type: 'presentation'
  });

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const [agendaData, speakersData] = await Promise.all([
        fetchEventAgenda(eventId),
        fetchEventSpeakers(eventId)
      ]);
      setAgenda(agendaData);
      setSpeakers(speakersData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      speaker_id: '',
      location: '',
      session_type: 'presentation'
    });
    setDialogOpen(true);
  };

  const handleEditItem = (item: EventAgenda) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      start_time: item.start_time,
      end_time: item.end_time,
      speaker_id: item.speaker_id || '',
      location: item.location || '',
      session_type: item.session_type
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const agendaData = {
      ...formData,
      event_id: eventId,
      order_index: editingItem?.order_index || agenda.length,
      speaker_id: formData.speaker_id || null
    };

    let result;
    if (editingItem) {
      result = await updateAgendaItem(editingItem.id, agendaData);
    } else {
      result = await createAgendaItem(agendaData);
    }

    if (result) {
      await loadData();
      setDialogOpen(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) return;
    
    const success = await deleteAgendaItem(itemId);
    if (success) {
      await loadData();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <CreatorLayout title="Event Agenda">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Event Agenda">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/creator/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Event Agenda</h2>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agenda Item
        </Button>
      </div>

      {agenda.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No agenda items yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Create a detailed agenda for your event
            </p>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agenda.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span>
                        {format(parseISO(item.start_time), 'MMM d, h:mm a')} - 
                        {format(parseISO(item.end_time), 'h:mm a')}
                      </span>
                      {item.location && <span>📍 {item.location}</span>}
                      <span className="capitalize">{item.session_type}</span>
                    </div>
                    {item.keynote_speakers && (
                      <p className="text-sm text-primary mt-1">
                        Speaker: {item.keynote_speakers.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {item.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Agenda Item' : 'Add Agenda Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this agenda item"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session_type">Session Type</Label>
                <Select 
                  value={formData.session_type} 
                  onValueChange={(value) => handleSelectChange('session_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="panel">Panel Discussion</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Room, online link, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="speaker_id">Speaker (Optional)</Label>
              <Select 
                value={formData.speaker_id} 
                onValueChange={(value) => handleSelectChange('speaker_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a speaker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No speaker assigned</SelectItem>
                  {speakers.map((speaker) => (
                    <SelectItem key={speaker.id} value={speaker.id}>
                      {speaker.name} {speaker.title && `- ${speaker.title}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default CreatorEventAgenda;
