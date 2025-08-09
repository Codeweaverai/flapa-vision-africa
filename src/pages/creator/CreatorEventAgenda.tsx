import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, MapPin, User } from 'lucide-react';
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
  speaker_id?: string | null;
  location?: string;
  session_type: string;
  order_index: number;
  keynote_speakers?: {
    id: string;
    name: string;
    title?: string;
  };
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    speaker_id: 'none', // FIX: Changed from '' to 'none'
    location: '',
    session_type: 'presentation'
  });

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error:', authError);
          toast.error('Authentication required');
          navigate('/login');
          return;
        }
        
        setCurrentUser(user);
        
        if (eventId && user) {
          await loadData();
        }
      } catch (error) {
        console.error('Error initializing:', error);
        toast.error('Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [eventId, navigate]);

  const loadData = async () => {
    if (!eventId) return;
    
    try {
      const [agendaResponse, speakersResponse] = await Promise.all([
        supabase
          .from('event_agenda')
          .select(`
            *,
            keynote_speakers (
              id,
              name,
              title
            )
          `)
          .eq('event_id', eventId)
          .order('start_time', { ascending: true }),
        
        supabase
          .from('keynote_speakers')
          .select('id, name, title')
          .eq('event_id', eventId)
          .order('name', { ascending: true })
      ]);

      if (agendaResponse.error) {
        console.error('Agenda error:', agendaResponse.error);
        toast.error('Failed to load agenda');
        return;
      }
      
      if (speakersResponse.error) {
        console.error('Speakers error:', speakersResponse.error);
        toast.error('Failed to load speakers');
        return;
      }

      setAgenda(agendaResponse.data || []);
      setSpeakers(speakersResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load event data');
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      speaker_id: 'none', // FIX: Changed from '' to 'none'
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
      start_time: format(parseISO(item.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(parseISO(item.end_time), "yyyy-MM-dd'T'HH:mm"),
      speaker_id: item.speaker_id || 'none', // FIX: Changed from '' to 'none'
      location: item.location || '',
      session_type: item.session_type
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !currentUser || submitting) return;

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Start and end times are required');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        speaker_id: formData.speaker_id === 'none' ? null : formData.speaker_id, // FIX: Convert 'none' to null
        location: formData.location.trim() || null,
        session_type: formData.session_type,
        event_id: eventId
      };

      if (editingItem) {
        const { error } = await supabase
          .from('event_agenda')
          .update(submitData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Agenda item updated successfully');
      } else {
        const nextOrderIndex = agenda.length > 0 ? Math.max(...agenda.map(a => a.order_index)) + 1 : 0;
        const { error } = await supabase
          .from('event_agenda')
          .insert({
            ...submitData,
            order_index: nextOrderIndex
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

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'presentation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'workshop': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'networking': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'panel': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <CreatorLayout title="Event Agenda">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gradient-to-r from-orange-400 to-purple-600 border-t-transparent"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-purple-600/20 animate-pulse"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Event Agenda">
      <div className="space-y-6">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-purple-600/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/creator/events')}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white hover:text-white/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddItem}
                  className="bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agenda Item
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {agenda.length === 0 ? (
          <Card className="border-dashed border-2 bg-gradient-to-br from-orange-50/50 to-purple-50/50">
            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
              <div className="mb-6 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 p-8">
                <Calendar className="h-12 w-12 text-transparent bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text" />
              </div>
              <CardTitle className="mb-3 text-2xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                No agenda items yet
              </CardTitle>
              <p className="text-gray-600 mb-8 max-w-md">
                Create a detailed schedule for your event to help attendees plan their day
              </p>
              <Button onClick={handleAddItem}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agenda.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-gradient-to-br from-white to-orange-50/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getSessionTypeColor(item.session_type)} font-medium px-3 py-1`}>
                          {item.session_type.charAt(0).toUpperCase() + item.session_type.slice(1)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gradient-to-r from-orange-100 to-purple-100 px-3 py-1 rounded-full">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {format(parseISO(item.start_time), 'HH:mm')} - {format(parseISO(item.end_time), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-orange-700 to-purple-700 bg-clip-text text-transparent">
                        {item.title}
                      </h3>
                      
                      {item.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm">
                        {item.keynote_speakers && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-orange-50 px-3 py-1 rounded-full">
                            <User className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-700">
                              {item.keynote_speakers.name}
                              {item.keynote_speakers.title && ` - ${item.keynote_speakers.title}`}
                            </span>
                          </div>
                        )}
                        
                        {item.location && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-purple-50 px-3 py-1 rounded-full">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-700">{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="bg-gradient-to-r from-orange-50 to-purple-50 hover:from-orange-100 hover:to-purple-100 border-orange-200 hover:border-purple-300 transition-all duration-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Agenda Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50/30">
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                {editingItem ? 'Edit Agenda Item' : 'Add New Agenda Item'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingItem ? 'Update the details of this agenda item.' : 'Create a new item for your event schedule.'}
              </DialogDescription>
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
                  className="bg-white/80 border-orange-200 focus:border-purple-400"
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
                  className="bg-white/80 border-orange-200 focus:border-purple-400"
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
                    className="bg-white/80 border-orange-200 focus:border-purple-400"
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
                    className="bg-white/80 border-orange-200 focus:border-purple-400"
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
                    <SelectTrigger className="bg-white/80 border-orange-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keynote">Keynote</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="panel">Panel Discussion</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="speaker_id">Speaker (Optional)</Label>
                  <Select
                    value={formData.speaker_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, speaker_id: value }))}
                  >
                    <SelectTrigger className="bg-white/80 border-orange-200 focus:border-purple-400">
                      <SelectValue placeholder="Select a speaker..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No speaker</SelectItem> {/* FIX: Changed from "" to "none" */}
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
                  className="bg-white/80 border-orange-200 focus:border-purple-400"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button> 
               <Button 
               type="submit" 
               className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
               >
              {submitting ? 'Processing...' : editingItem ? 'Update' : 'Create'} Item
             </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </CreatorLayout>
  );
};

export default CreatorEventAgenda;
