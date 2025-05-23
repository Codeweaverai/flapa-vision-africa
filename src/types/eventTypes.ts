
// Add missing types for events and registrations
export interface EventWithRegistrations {
  id: string;
  title: string;
  description: string;
  // Allow both date and start_time fields for flexibility
  date?: string;
  start_time?: string;
  location: string;
  registrations: CombinedRegistration[];
  // Additional fields from the API
  registrations_count?: number;
  bookings_count?: any;
  total_attendees?: any;
  capacity?: number;
  created_at?: string;
  creator_id?: string;
  currency?: string;
  end_time?: string;
  event_type?: string;
  updated_at?: string;
  [key: string]: any; // Allow for additional properties
}

export interface CombinedRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date?: string;
  created_at?: string;
  status: string;
  payment_status: string;
  ticket_number?: string; // Add ticket_number field
  user: {
    email: string;
    full_name: string;
    id: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional properties
}

// Course interfaces
export interface CourseWithEnrollment {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  image_url?: string;
  duration_minutes?: number;
  price?: number;
  is_free?: boolean;
  category?: string;
  difficulty_level?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  enrollment?: {
    id: string;
    enrollment_date: string;
    completion_date?: string;
    is_completed: boolean;
  };
  modules?: {
    id: string;
    title: string;
    lessons?: {
      id: string;
      title: string;
    }[];
  }[];
  [key: string]: any;
}

// Add simplified non-recursive types for CoursePlayerPage
export interface SimplifiedLesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  module_id: string;
  order_index: number;
  content_type?: string;
  content?: any;
  is_completed?: boolean;
}

export interface SimplifiedModule {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  order_index: number;
  lessons: SimplifiedLesson[];
}

export interface SimplifiedCourse {
  id: string;
  title: string;
  description: string;
  modules: SimplifiedModule[];
}

export interface RegistrationItem {
  id: string;
  user_id: string;
  entity_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string;
  payment_id?: string;
  user_fullname: string;
  user_email: string;
  title: string;
  date: string;
  type: 'event' | 'course';
  ticket_number?: string;
}
