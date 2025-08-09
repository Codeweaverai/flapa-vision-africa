
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Clock, MapPin, User } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';

interface EventAgendaItem {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  speaker_id?: string;
  location?: string;
  session_type: string;
  order_index: number;
  keynote_speakers?: {
    id: string;
    name: string;
    title?: string;
  };
}

interface KeynoteSpeaker {
  id: string;
  name: string;
  title?: string;
}

interface AgendaFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  speaker_id?: string;
  location?: string;
  session_type: string;
}

const EventAgenda = () => {
  const { id } = useParams<{ id: string }>();
  const [agenda, setAgenda] = useState<EventAgendaItem[]>([]);
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<EventAgendaItem | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AgendaFormData>();

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Authentication required');
        setLoading(false);
        return;
      }
      setCurrentUser(user);

      // Verify user owns this event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', id)
        .single();

      if (eventError || !eventData) {
        toast.error('Event not found');
        setLoading(false);
        return;
      }

      if (eventData.creator_id !== user?.id) {
        toast.error('Access denied');
        setLoading(false);
        return;
      }

      // Load agenda with speakers
      const { data: agendaData, error: agendaError } = await supabase
        .from('event_agenda')
        .select(`
          *,
          keynote_speakers:speaker_id (
            id,
            name,
            title
          )
        `)
        .eq('event_id', id)
        .order('order_index', { ascending: true });

      if (agendaError) {
        console.error('Agenda error:', agendaError);
        toast.error('Failed to load agenda');
      } else {
        setAgenda(agendaData || []);
      }

      // Load speakers
      const { data: speakersData, error: speakersError } = await supabase
        .from('keynote_speakers')
        .select('id, name, title')
        .eq('event_id', id)
        .order('name', { ascending: true });

      if (speakersError) {
        console.error('Speakers error:', speakersError);
        toast.error('Failed to load speakers');
      } else {
        setSpeakers(speakersData || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgenda = () => {
    setEditingAgenda(null);
    reset({
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

  const handleEditAgenda = (agendaItem: EventAgendaItem) => {
    setEditingAgenda(agendaItem);
    reset({
      title: agendaItem.title,
      description: agendaItem.description || '',
      start_time: format(parseISO(agendaItem.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(parseISO(agendaItem.end_time), "yyyy-MM-dd'T'HH:mm"),
      speaker_id: agendaItem.speaker_id || '',
      location: agendaItem.location || '',
      session_type: agendaItem.session_type
    });
    setDialogOpen(true);
  };

  const handleDeleteAgenda = async (agendaId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) return;
    
    try {
      const { error } = await supabase
        .from('event_agenda')
        .delete()
        .eq('id', agendaId);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete agenda item');
        return;
      }

      setAgenda(agenda.filter(item => item.id !== agendaId));
      toast.success('Agenda item deleted successfully');
    } catch (error) {
      console.error('Error deleting agenda item:', error);
      toast.error('Failed to delete agenda item');
    }
  };

  const onSubmit = async (data: AgendaFormData) => {
    if (!id || !currentUser) return;
    
    try {
      const agendaData = {
        ...data,
        event_id: id,
        order_index: editingAgenda ? editingAgenda.order_index : agenda.length,
        speaker_id: data.speaker_id || null
      };
      
      if (editingAgenda) {
        const { error } = await supabase
          .from('event_agenda')
          .update(agendaData)
          .eq('id', editingAgenda.id);

        if (error) {
          console.error('Update error:', error);
          toast.error('Failed to update agenda item');
          return;
        }
        toast.success('Agenda item updated successfully');
      } else {
        const { error } = await supabase
          .from('event_agenda')
          .insert(agendaData);

        if (error) {
          console.error('Insert error:', error);
          toast.error('Failed to create agenda item');
          return;
        }
        toast.success('Agenda item created successfully');
      }
      
      await loadData();
      setDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving agenda item:', error);
      toast.error('Failed to save agenda item');
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'presentation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'workshop': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'networking': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <CreatorLayout title="Event Agenda">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Event Agenda">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Link to="/creator/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          
          <Button onClick={handleCreateAgenda} className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Agenda Item
          </Button>
        </div>

        {agenda.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 p-6">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="mb-2 text-gray-800">No agenda items yet</CardTitle>
              <CardDescription className="mb-6 text-gray-600">
                Create a detailed schedule for your event
              </CardDescription>
              <Button onClick={handleCreateAgenda} className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agenda
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((item) => (
                <Card key={item.id} className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${getSessionTypeColor(item.session_type)} border`}>
                            {item.session_type}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(parseISO(item.start_time), 'HH:mm')} - {format(parseISO(item.end_time), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                        
                        {item.description && (
                          <p className="text-gray-600 mb-3">{item.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {item.keynote_speakers && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-purple-600" />
                              <span className="text-purple-700 font-medium">{item.keynote_speakers.name}</span>
                            </div>
                          )}
                          
                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-700 font-medium">{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAgenda(item)}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              {editingAgenda ? 'Edit Agenda Item' : 'Add New Agenda Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingAgenda ? 'Update agenda item details' : 'Add a new item to your event schedule'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title" className="text-gray-700 font-medium">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="border-gray-200 focus:border-orange-500"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the session..."
                  rows={3}
                  className="border-gray-200 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label htmlFor="start_time" className="text-gray-700 font-medium">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register('start_time', { required: 'Start time is required' })}
                  className="border-gray-200 focus:border-orange-500"
                />
                {errors.start_time && (
                  <p className="text-sm text-red-600 mt-1">{errors.start_time.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="end_time" className="text-gray-700 font-medium">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  {...register('end_time', { required: 'End time is required' })}
                  className="border-gray-200 focus:border-purple-500"
                />
                {errors.end_time && (
                  <p className="text-sm text-red-600 mt-1">{errors.end_time.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="session_type" className="text-gray-700 font-medium">Session Type *</Label>
                <Controller
                  name="session_type"
                  control={control}
                  defaultValue="presentation"
                  rules={{ required: 'Session type is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="border-gray-200 focus:border-orange-500">
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keynote">Keynote</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.session_type && (
                  <p className="text-sm text-red-600 mt-1">{errors.session_type.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="speaker_id" className="text-gray-700 font-medium">Speaker</Label>
                <Controller
                  name="speaker_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="border-gray-200 focus:border-purple-500">
                        <SelectValue placeholder="Select speaker (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Speaker</SelectItem>
                        {speakers.map((speaker) => (
                          <SelectItem key={speaker.id} value={speaker.id}>
                            {speaker.name} {speaker.title && `- ${speaker.title}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="e.g. Main Hall, Room 101, Online"
                  className="border-gray-200 focus:border-orange-500"
                />
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                {editingAgenda ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default EventAgenda;
