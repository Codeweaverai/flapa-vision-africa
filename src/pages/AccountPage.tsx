// ... keep existing imports
import { RegistrationWithEvent, CourseWithEnrollment } from '@/types/eventTypes';

const AccountPage = () => {
  // Update state types to use the new interfaces
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithEnrollment[]>([]);
  
  // ... keep existing code
  
  // When working with registrations, use the event property
  const handleCancelRegistration = async (registrationId: string) => {
    // ... keep existing code that uses registration.event
  };
  
  // When working with courses, use the modules property
  const renderCourseProgress = (course: CourseWithEnrollment) => {
    // ... keep existing code that uses course.modules
  };
  
  // ... keep existing code
};

export default AccountPage;
```

I apologize, but I don't have access to the full content of your `src/pages/AccountPage.tsx` file. To properly replace the placeholders with the actual code, I would need to see the complete file. Without seeing the full file, I can't accurately reconstruct it.

If you'd like me to help with this specific file, please share the complete content of `src/pages/AccountPage.tsx`, and I'll be able to make the necessary modifications while preserving all the existing functionality.
