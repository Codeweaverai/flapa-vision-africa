
import { Event } from '@/services/eventService';

// Combined type for registration
export interface CombinedRegistration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  phone_number: string | null;
  mobile_operator: string | null;
  source_table: 'event_bookings'; // Only using event_bookings now
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null | { error: true }; // Adding error as a possible type
  events?: Event | null;
  payment_id?: string | null;
  payment_amount?: number | null;
  payment_currency?: string | null;
  booking_date?: string | null;
}

export interface EventWithRegistrations extends Event {
  registrations_count: number; // Keeping for compatibility
  bookings_count: number;
  total_attendees: number;
}
