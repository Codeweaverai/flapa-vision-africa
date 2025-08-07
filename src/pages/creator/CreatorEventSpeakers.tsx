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
  const [eventId, setEventId] = useState<string>('');
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState<KeynoteSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
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

  // Initialize eventId from params or session storage
  useEffect(() => {
    if (eventIdParam) {
      setEventId(eventIdParam);
      sessionStorage.setItem('currentEventId', eventIdParam);
    } else {
      const storedEventId = sessionStorage.getItem('currentEventId');
      if (storedEventId) {
        setEventId(storedEventId);
      } else {
        console.error('No eventId found in params or storage');
        toast.error('Event ID is missing');
        navigate('/creator/events');
      }
    }
  }, [eventIdParam, navigate]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      if (!eventId) return;
      
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        setAuthChecked(true);
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

  const loadSpeakers = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error, status } = await supabase
        .from('keynote_speakers')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (error && status !== 406) {
        throw error;
      }

      setSpeakers(data || []);
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error('Failed to load speakers');
      
      if (error.message.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
        await supabase.auth.signOut();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting submit with eventId:', eventId);
    
    if (!formData.name.trim()) {
      toast.error('Speaker name is required');
      return;
    }

    if (!eventId) {
      toast.error('Event ID is missing');
      console.error('Submission prevented - missing eventId');
      return;
    }

    setSubmitting(true);
    console.log('Submitting form data:', formData);

    try {
      if (editingSpeaker) {
        const { error } = await supabase
          .from('keynote_speakers')
          .update(formData)
          .eq('id', editingSpeaker.id);

        if (error) throw error;
        toast.success('Speaker updated successfully');
      } else {
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
    } catch (error) {
      console.error('Error saving speaker:', error);
      toast.error(`Failed to save speaker: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ... (keep all other functions the same as in previous version)

  return (
    <CreatorLayout title="Event Speakers">
      {/* ... (keep all JSX the same as in previous version, but remove the disabled prop from submit button) */}
      <Button type="submit">
        {submitting ? 'Processing...' : editingSpeaker ? 'Update' : 'Create'} Speaker
      </Button>
      {/* ... (rest of the JSX remains the same) */}
    </CreatorLayout>
  );
};

export default CreatorEventSpeakers;
