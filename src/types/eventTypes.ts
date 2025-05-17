
import { Event } from '@/services/eventService';

// Combined type for both registration types
export interface CombinedRegistration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  phone_number: string | null;
  mobile_operator: string | null;
  source_table: 'registrations' | 'event_bookings'; // Track which table it came from
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null | { error: true }; // Adding error as a possible type
  events?: Event | null;
  payment_id?: string | null;
  payment_amount?: number | null;
  payment_currency?: string | null;
  payment_method?: string | null;
  booking_date?: string | null;
}

export interface EventWithRegistrations extends Event {
  registrations_count: number;
  bookings_count: number;
  total_attendees: number;
}
