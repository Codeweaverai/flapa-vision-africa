
import { supabase } from '@/lib/supabaseClient';

export interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  price?: number;
  is_free: boolean;
  currency?: string;
  capacity?: number;
  creator_id?: string;
  created_at: string;
  updated_at: string;
}

export async function fetchPastEvents(limit: number = 10): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .lt('end_time', new Date().toISOString()) // Past events
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchUpcomingEvents(limit: number = 10): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('start_time', new Date().toISOString()) // Future events
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchEventAttendeeCount(eventId: string): Promise<number> {
  const { data, error } = await supabase
    .from('event_bookings')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  if (error) throw error;
  return data?.length || 0;
}
