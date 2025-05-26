
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Types for keynote speakers
export interface KeynoteSpeaker {
  id: string;
  event_id: string;
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  speaking_topic?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

// Types for event agenda
export interface EventAgenda {
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
  created_at?: string;
  updated_at?: string;
  keynote_speakers?: KeynoteSpeaker;
}

// Keynote Speaker Functions
export const fetchEventSpeakers = async (eventId: string): Promise<KeynoteSpeaker[]> => {
  try {
    const { data, error } = await supabase
      .from('keynote_speakers')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event speakers:', error);
    toast.error('Failed to load speakers');
    return [];
  }
};

export const createSpeaker = async (speakerData: Partial<KeynoteSpeaker>): Promise<KeynoteSpeaker | null> => {
  try {
    const { data, error } = await supabase
      .from('keynote_speakers')
      .insert(speakerData)
      .select()
      .single();

    if (error) throw error;
    toast.success('Speaker added successfully');
    return data;
  } catch (error) {
    console.error('Error creating speaker:', error);
    toast.error('Failed to add speaker');
    return null;
  }
};

export const updateSpeaker = async (id: string, speakerData: Partial<KeynoteSpeaker>): Promise<KeynoteSpeaker | null> => {
  try {
    const { data, error } = await supabase
      .from('keynote_speakers')
      .update(speakerData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Speaker updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating speaker:', error);
    toast.error('Failed to update speaker');
    return null;
  }
};

export const deleteSpeaker = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('keynote_speakers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Speaker deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting speaker:', error);
    toast.error('Failed to delete speaker');
    return false;
  }
};

// Event Agenda Functions
export const fetchEventAgenda = async (eventId: string): Promise<EventAgenda[]> => {
  try {
    const { data, error } = await supabase
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
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event agenda:', error);
    toast.error('Failed to load agenda');
    return [];
  }
};

export const createAgendaItem = async (agendaData: Partial<EventAgenda>): Promise<EventAgenda | null> => {
  try {
    const { data, error } = await supabase
      .from('event_agenda')
      .insert(agendaData)
      .select()
      .single();

    if (error) throw error;
    toast.success('Agenda item added successfully');
    return data;
  } catch (error) {
    console.error('Error creating agenda item:', error);
    toast.error('Failed to add agenda item');
    return null;
  }
};

export const updateAgendaItem = async (id: string, agendaData: Partial<EventAgenda>): Promise<EventAgenda | null> => {
  try {
    const { data, error } = await supabase
      .from('event_agenda')
      .update(agendaData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success('Agenda item updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating agenda item:', error);
    toast.error('Failed to update agenda item');
    return null;
  }
};

export const deleteAgendaItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('event_agenda')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Agenda item deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting agenda item:', error);
    toast.error('Failed to delete agenda item');
    return false;
  }
};
