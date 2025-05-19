
// Add missing types for events and registrations
export interface EventWithRegistrations {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  registrations: CombinedRegistration[];
  [key: string]: any; // Allow for additional properties
}

export interface CombinedRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: string;
  payment_status: string;
  user: {
    email: string;
    full_name: string;
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
  [key: string]: any; // Allow for additional properties
}
