
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
import { 
  EventAgenda, 
  KeynoteSpeaker,
  CreateAgendaInput,
  fetchEventAgenda, 
  fetchEventSpeakers,
  createAgendaItem, 
  updateAgendaItem, 
  deleteAgendaItem 
} from '@/services/eventManagementService';

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
  const [agenda, setAgenda] = useState<EventAgenda[]>([]);
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<EventAgenda | null>(null);
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AgendaFormData>();

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [agendaData, speakersData] = await Promise.all([
        fetchEventAgenda(id),
        fetchEventSpeakers(id)
      ]);
      
      setAgenda(agendaData);
      setSpeakers(speakersData);
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
      session_type: 'presentation'
    });
    setDialogOpen(true);
  };

  const handleEditAgenda = (agendaItem: EventAgenda) => {
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
      const success = await deleteAgendaItem(agendaId);
      if (success) {
        setAgenda(agenda.filter(item => item.id !== agendaId));
      }
    } catch (error) {
      console.error('Error deleting agenda item:', error);
    }
  };

  const onSubmit = async (data: AgendaFormData) => {
    if (!id) return;
    
    try {
      const agendaData: CreateAgendaInput = {
        ...data,
        event_id: id,
        order_index: agenda.length
      };
      
      if (editingAgenda) {
        const updatedAgenda = await updateAgendaItem(editingAgenda.id, agendaData);
        if (updatedAgenda) {
          setAgenda(agenda.map(item => item.id === updatedAgenda.id ? updatedAgenda : item));
        }
      } else {
        const newAgenda = await createAgendaItem(agendaData);
        if (newAgenda) {
          setAgenda([...agenda, newAgenda]);
        }
      }
      
      setDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving agenda item:', error);
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 text-purple-800';
      case 'presentation': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'break': return 'bg-gray-100 text-gray-800';
      case 'networking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/creator/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          
          <Button onClick={handleCreateAgenda}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agenda Item
          </Button>
        </div>

        {agenda.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mb-2">No agenda items yet</CardTitle>
              <CardDescription className="mb-6">
                Create a detailed schedule for your event
              </CardDescription>
              <Button onClick={handleCreateAgenda}>
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
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getSessionTypeColor(item.session_type)}>
                            {item.session_type}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(parseISO(item.start_time), 'HH:mm')} - {format(parseISO(item.end_time), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        
                        {item.description && (
                          <p className="text-muted-foreground mb-3">{item.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {item.keynote_speakers && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{item.keynote_speakers.name}</span>
                            </div>
                          )}
                          
                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAgenda(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="text-destructive hover:text-destructive"
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

      {/* Agenda Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAgenda ? 'Edit Agenda Item' : 'Add New Agenda Item'}
            </DialogTitle>
            <DialogDescription>
              {editingAgenda ? 'Update agenda item details' : 'Add a new item to your event schedule'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the session..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register('start_time', { required: 'Start time is required' })}
                />
                {errors.start_time && (
                  <p className="text-sm text-destructive mt-1">{errors.start_time.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  {...register('end_time', { required: 'End time is required' })}
                />
                {errors.end_time && (
                  <p className="text-sm text-destructive mt-1">{errors.end_time.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="session_type">Session Type *</Label>
                <Controller
                  name="session_type"
                  control={control}
                  defaultValue="presentation"
                  rules={{ required: 'Session type is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                  <p className="text-sm text-destructive mt-1">{errors.session_type.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="speaker_id">Speaker</Label>
                <Controller
                  name="speaker_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="e.g. Main Hall, Room 101, Online"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
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
