
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
}
