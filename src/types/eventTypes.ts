
import { Event, Registration } from '@/services/eventService';
import { Course } from '@/services/courseService';

export interface RegistrationWithEvent extends Registration {
  event: Event;
}

export interface CourseWithEnrollment extends Course {
  enrollment?: {
    id: string;
    enrollment_date: string;
    completion_date?: string;
    is_completed: boolean;
  };
  image_url?: string; // Adding this property
}

// New interfaces needed for admin components
export interface CombinedRegistration extends Registration {
  events?: Event;
  profiles?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  source_table?: 'event_bookings' | 'registrations';
}

export interface EventWithRegistrations extends Event {
  registrations_count: number;
  bookings_count: number;
  total_attendees: number;
}
