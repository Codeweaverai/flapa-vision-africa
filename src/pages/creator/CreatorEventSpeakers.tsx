
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { KeynoteSpeaker, fetchEventSpeakers, createSpeaker, updateSpeaker, deleteSpeaker } from '@/services/eventManagementService';

const CreatorEventSpeakers = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<KeynoteSpeaker | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    image_url: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: '',
    speaking_topic: ''
  });

  useEffect(() => {
    if (eventId) {
      loadSpeakers();
    }
  }, [eventId]);

  const loadSpeakers = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const speakersData = await fetchEventSpeakers(eventId);
      setSpeakers(speakersData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpeaker = () => {
    setEditingSpeaker(null);
    setFormData({
      name: '',
      title: '',
      bio: '',
      image_url: '',
      linkedin_url: '',
      twitter_url: '',
      website_url: '',
      speaking_topic: ''
    });
    setDialogOpen(true);
  };

  const handleEditSpeaker = (speaker: KeynoteSpeaker) => {
    setEditingSpeaker(speaker);
    setFormData({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const speakerData = {
      ...formData,
      event_id: eventId,
      order_index: editingSpeaker?.order_index || speakers.length
    };

    let result;
    if (editingSpeaker) {
      result = await updateSpeaker(editingSpeaker.id, speakerData);
    } else {
      result = await createSpeaker(speakerData);
    }

    if (result) {
      await loadSpeakers();
      setDialogOpen(false);
    }
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return;
    
    const success = await deleteSpeaker(speakerId);
    if (success) {
      await loadSpeakers();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <h2 className="text-2xl font-bold">Keynote Speakers</h2>
        <Button onClick={handleAddSpeaker}>
          <Plus className="h-4 w-4 mr-2" />
          Add Speaker
        </Button>
      </div>

      {speakers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No speakers yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Add keynote speakers to showcase your event's expertise
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
                  <div className="flex-1">
                    {speaker.image_url && (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-16 h-16 rounded-full object-cover mb-4"
                      />
                    )}
                    <CardTitle className="text-lg">{speaker.name}</CardTitle>
                    {speaker.title && (
                      <p className="text-sm text-muted-foreground">{speaker.title}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditSpeaker(speaker)}>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. CEO, CTO, etc."
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
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief biography of the speaker"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image_url">Profile Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSpeaker ? 'Update' : 'Add'} Speaker
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default CreatorEventSpeakers;
