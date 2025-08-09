
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  speaking_topic?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  order_index: number;
  user_id?: string;
}

const CreatorEventSpeakers = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
          await loadSpeakers();
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

  const loadSpeakers = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('keynote_speakers')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading speakers:', error);
        toast.error('Failed to load speakers');
        return;
      }
      
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error('Failed to load speakers');
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !currentUser || submitting) return;

    console.log('Starting form submission...', { eventId, currentUser: currentUser?.id, formData });

    if (!formData.name.trim()) {
      toast.error('Speaker name is required');
      return;
    }

    setSubmitting(true);
    
    try {
      // First, verify the user owns this event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', eventId)
        .single();

      console.log('Event verification:', { eventData, eventError });

      if (eventError || !eventData) {
        console.error('Event not found or error:', eventError);
        toast.error('Event not found or access denied');
        return;
      }

      if (eventData.creator_id !== currentUser.id) {
        console.error('Permission denied:', { eventCreator: eventData.creator_id, currentUser: currentUser.id });
        toast.error('You do not have permission to add speakers to this event');
        return;
      }

      const speakerData = {
        name: formData.name.trim(),
        title: formData.title.trim() || null,
        bio: formData.bio.trim() || null,
        image_url: formData.image_url || null,
        speaking_topic: formData.speaking_topic.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        twitter_url: formData.twitter_url.trim() || null,
        website_url: formData.website_url.trim() || null,
        event_id: eventId,
        user_id: currentUser.id
      };

      console.log('Speaker data to submit:', speakerData);

      if (editingSpeaker) {
        console.log('Updating existing speaker:', editingSpeaker.id);
        const { data: updateData, error } = await supabase
          .from('keynote_speakers')
          .update(speakerData)
          .eq('id', editingSpeaker.id)
          .select();

        console.log('Update response:', { updateData, error });

        if (error) {
          console.error('Update error details:', error);
          toast.error(`Failed to update speaker: ${error.message}`);
          return;
        } 
        toast.success('Speaker updated successfully');
      } else {
        console.log('Creating new speaker...');
        const nextOrderIndex = speakers.length > 0 ? Math.max(...speakers.map(s => s.order_index)) + 1 : 0;
        const insertData = {
          ...speakerData,
          order_index: nextOrderIndex
        };
        
        console.log('Insert data:', insertData);

        const { data: insertResult, error } = await supabase
          .from('keynote_speakers')
          .insert(insertData)
          .select();

        console.log('Insert response:', { insertResult, error });

        if (error) {
          console.error('Insert error details:', error);
          toast.error(`Failed to add speaker: ${error.message}`);
          return;
        }
        toast.success('Speaker added successfully');
      }

      await loadSpeakers();
      setDialogOpen(false);
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
    } catch (error) {
      console.error('Error saving speaker:', error);
      toast.error(`Failed to save speaker: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return;
    
    try {
      const { error } = await supabase
        .from('keynote_speakers')
        .delete()
        .eq('id', speakerId);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete speaker');
        return;
      }
      
      await loadSpeakers();
      toast.success('Speaker deleted successfully');
    } catch (error) {
      console.error('Error deleting speaker:', error);
      toast.error('Failed to delete speaker');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
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
    <CreatorLayout title="Event Speakers & Performers">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/creator/events')}
          className="mb-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white hover:text-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Event Speakers</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddSpeaker}
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Speaker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                {editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingSpeaker ? 'Update the speaker information below.' : 'Add a new speaker to your event by filling out the form below.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImage={formData.image_url}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Speaker Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. John Doe"
                    className="border-gray-200 focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="title" className="text-gray-700 font-medium">Title/Position</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. CEO, Tech Company"
                    className="border-gray-200 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="speaking_topic" className="text-gray-700 font-medium">Speaking Topic</Label>
                <Input
                  id="speaking_topic"
                  name="speaking_topic"
                  value={formData.speaking_topic}
                  onChange={handleChange}
                  placeholder="What will they be speaking about?"
                  className="border-gray-200 focus:border-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-gray-700 font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Brief biography..."
                  rows={3}
                  className="border-gray-200 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="linkedin_url" className="text-gray-700 font-medium">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                    className="border-gray-200 focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter_url" className="text-gray-700 font-medium">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    name="twitter_url"
                    value={formData.twitter_url}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                    className="border-gray-200 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label htmlFor="website_url" className="text-gray-700 font-medium">Website URL</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="border-gray-200 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !formData.name.trim()}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : editingSpeaker ? 'Update Speaker' : 'Create Speaker'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {speakers.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 p-6">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="mb-2 text-gray-800">No speakers yet</CardTitle>
            <p className="text-gray-600 mb-6">
              Add keynote speakers for your event
            </p>
            <Button onClick={handleAddSpeaker}
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Speaker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <Card key={speaker.id} className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {speaker.image_url ? (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {speaker.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg text-gray-800">{speaker.name}</CardTitle>
                      {speaker.title && (
                        <p className="text-sm text-gray-600">{speaker.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditSpeaker(speaker)}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteSpeaker(speaker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {speaker.speaking_topic && (
                  <p className="text-sm font-medium mb-2 text-purple-700">Topic: {speaker.speaking_topic}</p>
                )}
                {speaker.bio && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{speaker.bio}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {speaker.linkedin_url && (
                    <Button variant="outline" size="sm" asChild className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50">
                      <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {speaker.twitter_url && (
                    <Button variant="outline" size="sm" asChild className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
                      <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                        Twitter
                      </a>
                    </Button>
                  )}
                  {speaker.website_url && (
                    <Button variant="outline" size="sm" asChild className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50">
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
