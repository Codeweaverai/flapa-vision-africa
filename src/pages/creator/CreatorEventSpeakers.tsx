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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Edit, Trash2, User, Linkedin, Twitter, Globe, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import ImageUpload from '@/components/ui/image-upload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KeynoteSpeaker {
  id: string;
  event_id: string;
  name: string;
  role: string;
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

const roleOptions = [
  { value: 'keynote', label: 'Keynote Speaker', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'panelist', label: 'Panelist', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'performer', label: 'Performer', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'artist', label: 'Artist', color: 'bg-green-100 text-green-800 border-green-200' }
];

const CreatorEventSpeakers = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<KeynoteSpeaker | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'keynote',
    title: '',
    bio: '',
    image_url: '',
    speaking_topic: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: ''
  });

  useEffect(() => {
    console.log('Initializing with eventId:', eventId);
    
    if (!eventId) {
      console.error('Missing eventId in URL');
      toast.error('No event selected');
      navigate('/creator/events');
      return;
    }

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
        
        if (user) {
          await loadSpeakers();
        }
      } catch (error) {
        console.error('Initialization error:', error);
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

      console.log('Loaded speakers:', data);

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
      role: 'keynote',
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
      role: speaker.role || 'keynote',
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
    console.log('Submitting for event:', eventId);

    if (!eventId || !currentUser || submitting) {
      console.error('Submission blocked:', { eventId, currentUser, submitting });
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSubmitting(true);
    
    try {
      // Verify event ownership
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        console.error('Event verification failed:', eventError);
        toast.error('Event not found or access denied');
        return;
      }

      if (eventData.creator_id !== currentUser.id) {
        toast.error('You do not have permission to add speakers to this event');
        return;
      }

      const speakerData = {
        name: formData.name.trim(),
        role: formData.role,
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

      if (editingSpeaker) {
        const { error } = await supabase
          .from('keynote_speakers')
          .update(speakerData)
          .eq('id', editingSpeaker.id);

        if (error) {
          console.error('Update error:', error);
          toast.error(`Failed to update speaker: ${error.message}`);
          return;
        } 
        toast.success('Speaker updated successfully');
      } else {
        const nextOrderIndex = speakers.length > 0 ? Math.max(...speakers.map(s => s.order_index)) + 1 : 0;
        const { error } = await supabase
          .from('keynote_speakers')
          .insert({ ...speakerData, order_index: nextOrderIndex });

        if (error) {
          console.error('Insert error:', error);
          toast.error(`Failed to add speaker: ${error.message}`);
          return;
        }
        toast.success('Speaker added successfully');
      }

      await loadSpeakers();
      setDialogOpen(false);
      setFormData({
        name: '',
        role: 'keynote',
        title: '',
        bio: '',
        image_url: '',
        speaking_topic: '',
        linkedin_url: '',
        twitter_url: '',
        website_url: ''
      });
    } catch (error) {
      console.error('Submission error:', error);
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
      console.error('Deletion error:', error);
      toast.error('Failed to delete speaker');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  const getRoleDisplayName = (role: string) => {
    const roleOption = roleOptions.find(opt => opt.value === role);
    return roleOption ? roleOption.label : role;
  };

  const getRoleColor = (role: string) => {
    const roleOption = roleOptions.find(opt => opt.value === role);
    return roleOption ? roleOption.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'keynote':
        return '🎤';
      case 'panelist':
        return '💬';
      case 'performer':
        return '🎭';
      case 'artist':
        return '🎨';
      default:
        return '👤';
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
    <CreatorLayout title="Event Speakers & Performers">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/creator/events')}
          className="mb-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white hover:text-white/90 transition-all duration-300 shadow-lg hover:shadow-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Event Speakers & Performers</h2>
          <p className="text-gray-600 mt-1">Manage all participants for your event</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddSpeaker}
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                {editingSpeaker ? 'Edit Participant' : 'Add Participant'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingSpeaker ? 'Update the participant information below.' : 'Add a new participant to your event by filling out the form below.'}
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
                    Name *
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
                  <Label htmlFor="role" className="text-gray-700 font-medium">
                    Role *
                  </Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="border-gray-200 focus:border-purple-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-gray-700 font-medium">Title/Position</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. CEO, Tech Company or Band Name"
                  className="border-gray-200 focus:border-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="speaking_topic" className="text-gray-700 font-medium">
                  {formData.role === 'performer' ? 'Performance Details' : 
                   formData.role === 'artist' ? 'Artistic Focus' : 'Speaking Topic'}
                </Label>
                <Input
                  id="speaking_topic"
                  name="speaking_topic"
                  value={formData.speaking_topic}
                  onChange={handleChange}
                  placeholder={
                    formData.role === 'performer' ? 'What will they be performing?' :
                    formData.role === 'artist' ? 'What is their artistic focus?' :
                    'What will they be speaking about?'
                  }
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
                  placeholder="Brief biography or description..."
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
                  className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !formData.name.trim()}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : editingSpeaker ? 'Update Participant' : 'Create Participant'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {speakers.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-gradient-to-br from-orange-50 to-purple-50">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 p-6">
              <User className="h-12 w-12 text-purple-600" />
            </div>
            <CardTitle className="mb-2 text-2xl font-bold text-gray-800">No participants yet</CardTitle>
            <p className="text-gray-600 mb-6 text-lg max-w-md">
              Add speakers, performers, artists, or panelists to showcase your event's talent
            </p>
            <Button onClick={handleAddSpeaker}
              className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg px-8 py-3 text-lg">
              <Plus className="h-5 w-5 mr-2" />
              Add First Participant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <Card key={speaker.id} className="group border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                      <AvatarImage src={speaker.image_url} alt={speaker.name} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold text-lg">
                        {speaker.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900 truncate">{speaker.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {speaker.title && (
                          <p className="text-sm text-gray-600 truncate">{speaker.title}</p>
                        )}
                        <Badge className={`text-xs px-2 py-1 ${getRoleColor(speaker.role)}`}>
                          <span className="mr-1">{getRoleIcon(speaker.role)}</span>
                          {getRoleDisplayName(speaker.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditSpeaker(speaker)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSpeaker(speaker.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {speaker.speaking_topic && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {speaker.role === 'performer' ? 'Performance' : 
                       speaker.role === 'artist' ? 'Artistic Focus' : 'Topic'}
                    </p>
                    <p className="text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                      {speaker.speaking_topic}
                    </p>
                  </div>
                )}
                {speaker.bio && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{speaker.bio}</p>
                  </div>
                )}
                
                {/* Social Links */}
                <div className="flex gap-2">
                  {speaker.linkedin_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="h-8 px-2 border-blue-200 hover:bg-blue-50 text-blue-600"
                    >
                      <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {speaker.twitter_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="h-8 px-2 border-sky-200 hover:bg-sky-50 text-sky-500"
                    >
                      <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {speaker.website_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="h-8 px-2 border-gray-200 hover:bg-gray-50 text-gray-600"
                    >
                      <a href={speaker.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3 w-3" />
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
