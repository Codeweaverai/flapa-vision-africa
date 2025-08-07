
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface AgendaItem {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  speaker_id?: string;
  location?: string;
  session_type: string;
}

interface Speaker {
  id: string;
  name: string;
  title?: string;
}

const CreatorEventAgenda = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    } else {
      setLoading(false);
      toast.error('Event ID is missing');
      navigate('/creator/events');
    }
  }, [eventId, navigate]);

  const loadData = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      // Load agenda and speakers in parallel
      const [agendaResult, speakersResult] = await Promise.all([
        supabase
          .from('event_agenda')
          .select('*')
          .eq('event_id', eventId)
          .order('start_time', { ascending: true }),
        supabase
          .from('keynote_speakers')
          .select('id, name, title')
          .eq('event_id', eventId)
          .order('name', { ascending: true })
      ]);

      if (agendaResult.error) {
        console.error('Error loading agenda:', agendaResult.error);
        toast.error('Failed to load agenda');
      } else {
        setAgenda(agendaResult.data || []);
      }

      if (speakersResult.error) {
        console.error('Error loading speakers:', speakersResult.error);
        // Don't show error for speakers as it's not critical
      } else {
        setSpeakers(speakersResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load event data');
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

  const handleEditItem = (item: AgendaItem) => {
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

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Start time and end time are required');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        speaker_id: formData.speaker_id || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('event_agenda')
          .update(submitData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Agenda item updated successfully');
      } else {
        const { error } = await supabase
          .from('event_agenda')
          .insert({
            ...submitData,
            event_id: eventId
          });

        if (error) throw error;
        toast.success('Agenda item created successfully');
      }

      await loadData();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving agenda item:', error);
      toast.error('Failed to save agenda item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) return;
    
    try {
      const { error } = await supabase
        .from('event_agenda')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      await loadData();
      toast.success('Agenda item deleted successfully');
    } catch (error) {
      console.error('Error deleting agenda item:', error);
      toast.error('Failed to delete agenda item');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSpeakerName = (speakerId?: string) => {
    if (!speakerId) return null;
    const speaker = speakers.find(s => s.id === speakerId);
    return speaker ? `${speaker.name}${speaker.title ? ` (${speaker.title})` : ''}` : null;
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agenda Item
            </Button>
          </DialogTrigger>
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
                  placeholder="e.g. Opening Keynote"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of this session..."
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="panel">Panel Discussion</SelectItem>
                      <SelectItem value="keynote">Keynote</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="speaker_id">Speaker (Optional)</Label>
                  <Select
                    value={formData.speaker_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, speaker_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a speaker..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No speaker</SelectItem>
                      {speakers.map((speaker) => (
                        <SelectItem key={speaker.id} value={speaker.id}>
                          {speaker.name}{speaker.title && ` (${speaker.title})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Main Hall, Room A, Online"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : editingItem ? 'Update' : 'Create'} Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {agenda.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No agenda items yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Create your event schedule
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
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {item.session_type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(item.start_time), 'PPP p')} - {format(parseISO(item.end_time), 'p')}
                    </div>
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
              <CardContent>
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {getSpeakerName(item.speaker_id) && (
                    <span><strong>Speaker:</strong> {getSpeakerName(item.speaker_id)}</span>
                  )}
                  {item.location && (
                    <span><strong>Location:</strong> {item.location}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CreatorLayout>
  );
};

export default CreatorEventAgenda;
