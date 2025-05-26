
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, User, Linkedin, Twitter, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { 
  KeynoteSpeaker, 
  CreateSpeakerInput,
  fetchEventSpeakers, 
  createSpeaker, 
  updateSpeaker, 
  deleteSpeaker 
} from '@/services/eventManagementService';

interface SpeakerFormData {
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  speaking_topic?: string;
}

const EventSpeakers = () => {
  const { id } = useParams<{ id: string }>();
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<KeynoteSpeaker | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SpeakerFormData>();

  useEffect(() => {
    if (!id) return;
    loadSpeakers();
  }, [id]);

  const loadSpeakers = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const speakersData = await fetchEventSpeakers(id);
      setSpeakers(speakersData);
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error('Failed to load speakers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpeaker = () => {
    setEditingSpeaker(null);
    reset();
    setDialogOpen(true);
  };

  const handleEditSpeaker = (speaker: KeynoteSpeaker) => {
    setEditingSpeaker(speaker);
    reset({
      name: speaker.name,
      title: speaker.title || '',
      bio: speaker.bio || '',
      image_url: speaker.image_url || '',
      linkedin_url: speaker.linkedin_url || '',
      twitter_url: speaker.twitter_url || '',
      website_url: speaker.website_url || '',
      speaking_topic: speaker.speaking_topic || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return;
    
    try {
      const success = await deleteSpeaker(speakerId);
      if (success) {
        setSpeakers(speakers.filter(s => s.id !== speakerId));
      }
    } catch (error) {
      console.error('Error deleting speaker:', error);
    }
  };

  const onSubmit = async (data: SpeakerFormData) => {
    if (!id) return;
    
    try {
      if (editingSpeaker) {
        const updatedSpeaker = await updateSpeaker(editingSpeaker.id, data);
        if (updatedSpeaker) {
          setSpeakers(speakers.map(s => s.id === updatedSpeaker.id ? updatedSpeaker : s));
        }
      } else {
        const speakerData: CreateSpeakerInput = {
          ...data,
          event_id: id,
          order_index: speakers.length
        };
        
        const newSpeaker = await createSpeaker(speakerData);
        if (newSpeaker) {
          setSpeakers([...speakers, newSpeaker]);
        }
      }
      
      setDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving speaker:', error);
    }
  };

  if (loading) {
    return (
      <CreatorLayout title="Event Speakers">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Event Speakers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/creator/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
          
          <Button onClick={handleCreateSpeaker}>
            <Plus className="h-4 w-4 mr-2" />
            Add Speaker
          </Button>
        </div>

        {speakers.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mb-2">No speakers added yet</CardTitle>
              <CardDescription className="mb-6">
                Add keynote speakers to showcase your event lineup
              </CardDescription>
              <Button onClick={handleCreateSpeaker}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Speaker
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {speakers.map((speaker) => (
              <Card key={speaker.id} className="flex flex-col">
                <CardHeader className="text-center">
                  {speaker.image_url ? (
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <CardTitle className="text-lg">{speaker.name}</CardTitle>
                  {speaker.title && (
                    <CardDescription>{speaker.title}</CardDescription>
                  )}
                  
                  {speaker.speaking_topic && (
                    <Badge variant="outline" className="mt-2">
                      {speaker.speaking_topic}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="flex-grow">
                  {speaker.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {speaker.bio}
                    </p>
                  )}
                  
                  <div className="flex gap-2 justify-center">
                    {speaker.linkedin_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {speaker.twitter_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {speaker.website_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={speaker.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
                
                <div className="p-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSpeaker(speaker)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSpeaker(speaker.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Speaker Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpeaker ? 'Edit Speaker' : 'Add New Speaker'}
            </DialogTitle>
            <DialogDescription>
              {editingSpeaker ? 'Update speaker information' : 'Add a keynote speaker to your event'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="title">Title/Position</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g. CEO, Senior Developer"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="speaking_topic">Speaking Topic</Label>
                <Input
                  id="speaking_topic"
                  {...register('speaking_topic')}
                  placeholder="e.g. AI in Healthcare, Future of Web Development"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Speaker's biography..."
                  rows={3}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="image_url">Profile Image URL</Label>
                <Input
                  id="image_url"
                  {...register('image_url')}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  {...register('linkedin_url')}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              
              <div>
                <Label htmlFor="twitter_url">Twitter URL</Label>
                <Input
                  id="twitter_url"
                  {...register('twitter_url')}
                  placeholder="https://twitter.com/username"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  {...register('website_url')}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSpeaker ? 'Update Speaker' : 'Add Speaker'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default EventSpeakers;
