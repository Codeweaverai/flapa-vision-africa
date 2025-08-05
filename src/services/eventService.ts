
import { supabase } from '@/lib/supabaseClient';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  online_meeting_link?: string;
  capacity?: number;
  is_free: boolean;
  price?: number;
  currency?: string;
  image_url?: string;
  creator_id?: string;
  workplace_id?: string;
  created_at: string;
  updated_at: string;
}

// Valid event types that match the database constraint
export const VALID_EVENT_TYPES = [
  'webinar',
  'workshop',
  'conference',
  'seminar',
  'meetup',
  'training',
  'networking',
  'presentation'
];

export const createEventWithCreator = async (eventData: Partial<Event>, creatorId: string): Promise<Event | null> => {
  try {
    // Ensure event_type is lowercase and valid
    const processedEventData = {
      ...eventData,
      creator_id: creatorId,
      event_type: eventData.event_type?.toLowerCase()
    };

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(processedEventData.event_type || '')) {
      throw new Error(`Invalid event type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('events')
      .insert([processedEventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};
