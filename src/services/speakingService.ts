
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface SpeakingTopic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SpeakingAppearance {
  id: string;
  title: string;
  event_name: string;
  location: string;
  event_date: string;
  description: string;
  appearance_type: 'Keynote' | 'Panel' | 'Workshop' | 'Interview';
  media_link?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpeakingBooking {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  organization: string;
  event_type: string;
  event_date: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export const fetchSpeakingTopics = async (): Promise<SpeakingTopic[]> => {
  try {
    const { data, error } = await supabase
      .from('speaking_topics')
      .select('*')
      .order('title', { ascending: true });
      
    if (error) {
      console.error('Error fetching speaking topics:', error);
      toast.error("Failed to load speaking topics");
      return [];
    }
    
    return data as SpeakingTopic[];
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const fetchSpeakingAppearances = async (): Promise<SpeakingAppearance[]> => {
  try {
    const { data, error } = await supabase
      .from('speaking_appearances')
      .select('*')
      .order('event_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching speaking appearances:', error);
      toast.error("Failed to load speaking appearances");
      return [];
    }
    
    return data as SpeakingAppearance[];
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const fetchUserSpeakingBookings = async (user: User | null): Promise<SpeakingBooking[]> => {
  if (!user) return [];
  
  try {
    const { data, error } = await supabase
      .from('speaking_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching user speaking bookings:', error);
      toast.error("Failed to load your speaking booking requests");
      return [];
    }
    
    return data as SpeakingBooking[];
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return [];
  }
};

export const createSpeakingBooking = async (bookingData: Omit<SpeakingBooking, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<SpeakingBooking | null> => {
  try {
    const { data, error } = await supabase
      .from('speaking_bookings')
      .insert({
        ...bookingData,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating speaking booking:', error);
      toast.error("Failed to submit speaking request");
      return null;
    }
    
    toast.success("Speaking request submitted successfully!");
    return data as SpeakingBooking;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error("An unexpected error occurred");
    return null;
  }
};
