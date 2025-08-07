
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Edit, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import ImageUpload from '@/components/ui/image-upload';

interface KeynoteSpeaker {
  id: string;
  event_id: string;
  user_id?: string;
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  speaking_topic?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  order_index: number;
}

const CreatorEventSpeakers = () => {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState<string>('');
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<KeynoteSpeaker | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    image_url: '',
    speaking_topic: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: ''
  });
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Initialize eventId from URL params
  useEffect(() => {
    if (!eventIdParam) {
      toast.error('Event ID is missing from URL');
      navigate('/creator/events');
      return;
    }
    setEventId(eventIdParam);
  }, [eventIdParam, navigate]);

  // Check auth and load speakers
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          throw new Error('Not authenticated');
        }
        setCurrentUser({ id: user.id });
        await loadSpeakers();
      } catch (error) {
        console.error('Authentication check failed:', error);
        toast.error('Please sign in to manage speakers');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [eventId, navigate]);

  // Load speakers from supabase
  const loadSpeakers = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keynote_speakers')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error('Failed to load speakers');
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for new speaker
  const handleAddSpeaker = () => {
    setEditingSpeaker(null);
    setFormData({
      name: '',
      title: '',
      bio: '',
      image_url: '',
      speaking_topic: '',
      linkedin_url: '',
      twitter_url: '',
      website_url: ''
    });
    setDialogOpen(true);
  };

  // Open dialog for editing speaker
  const handleEditSpeaker = (speaker: KeynoteSpeaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      title: speaker.title || '',
      bio: speaker.bio || '',
      image_url: speaker.image_url || '',
      speaking_topic: speaker.speaking_topic || '',
      linkedin_url: speaker.linkedin_url || '',
      twitter_url: speaker.twitter_url || '',
      website_url: speaker.website_url || ''
    });
    setDialogOpen(true);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image upload callback
  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  // Submit create or update speaker
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Speaker name is required');
      return;
    }
    if (!eventId) {
      toast.error('Event ID is missing');
      return;
    }
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSpeaker) {
        // Update existing speaker
        const { error } = await supabase
          .from('keynote_speakers')
          .update(formData)
          .eq('id', editingSpeaker.id);

        if (error) throw error;
        toast.success('Speaker updated successfully');
      } else {
        // Insert new speaker
        const nextOrderIndex = speakers.length > 0 ? Math.max(...speakers.map(s => s.order_index)) + 1 : 0;

        const { error } = await supabase
          .from('keynote_speakers')
          .insert({
            ...formData,
            event_id: eventId,
            order_index: nextOrderIndex
          });

        if (error) throw error;
        toast.success('Speaker created successfully');
      }

      await loadSpeakers();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving speaker:', error);
      toast.error(`Failed to save speaker: ${error.message || error}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete speaker
  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return;
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }
    try {
      const { error } = await supabase
        .from('keynote_speakers')
        .delete()
        .eq('id', speakerId);

      if (error) throw error;
      await loadSpeakers();
      toast.success('Speaker deleted successfully');
    } catch (error) {
      console.error('Error deleting speaker:', error);
      toast.error('Failed to delete speaker');
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
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/creator/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Event Speakers</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddSpeaker}>
              <Plus className="h-4 w-4 mr-2" />
              Add Speaker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImage={formData.image_url}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Speaker Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title/Position</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. CEO, Tech Company"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="speaking_topic">Speaking Topic</Label>
                <Input
                  id="speaking_topic"
                  name="speaking_topic"
                  value={formData.speaking_topic}
                  onChange={handleChange}
                  placeholder="What will they be speaking about?"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Brief biography..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_url">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    name="twitter_url"
                    value={formData.twitter_url}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : editingSpeaker ? 'Update' : 'Create'} Speaker
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {speakers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No speakers yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Add keynote speakers for your event
            </p>
            <Button onClick={handleAddSpeaker}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Speaker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <Card key={speaker.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {speaker.image_url ? (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {speaker.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{speaker.name}</CardTitle>
                      {speaker.title && (
                        <p className="text-sm text-muted-foreground">{speaker.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditSpeaker(speaker)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSpeaker(speaker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {speaker.speaking_topic && (
                  <p className="text-sm font-medium mb-2">Topic: {speaker.speaking_topic}</p>
                )}
                {speaker.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{speaker.bio}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {speaker.linkedin_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {speaker.twitter_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                        Twitter
                      </a>
                    </Button>
                  )}
                  {speaker.website_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={speaker.website_url} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </Button>
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

export default CreatorEventSpeakers;
