
// Import React and routing dependencies
import { Routes, Route } from 'react-router-dom';

// Import pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ConsultPage from '@/pages/ConsultPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import LearningPage from '@/pages/LearningPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseLearningPage from '@/pages/CourseLearningPage';
import AccountPage from '@/pages/AccountPage';
import AuthPage from '@/pages/AuthPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import NotFoundPage from '@/pages/NotFoundPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import MediaPage from '@/pages/MediaPage';

// Import admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminSettings from '@/pages/admin/AdminSettings';
import EventForm from '@/pages/admin/EventForm';
import CourseForm from '@/pages/admin/CourseForm';
import CourseContentPage from '@/pages/admin/CourseContentPage';

// Import creator pages
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorCourseForm from '@/pages/creator/CreatorCourseForm';
import CreatorEventForm from '@/pages/creator/CreatorEventForm';
import CreatorEventRegistrations from '@/pages/creator/CreatorEventRegistrations';
import AdminEventRegistrations from '@/pages/admin/AdminEventRegistrations';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/media" element={<MediaPage />} />
      <Route path="/consult" element={<ConsultPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/learning" element={<LearningPage />} />
      <Route path="/learning/course/:courseId" element={<CourseDetailPage />} />
      <Route path="/learning/course/:courseId/learn" element={<CourseLearningPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/consultations" element={<AdminConsultations />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/events/create" element={<EventForm />} />
      <Route path="/admin/events/edit/:eventId" element={<EventForm />} />
      <Route path="/admin/courses" element={<AdminCourses />} />
      <Route path="/admin/courses/create" element={<CourseForm />} />
      <Route path="/admin/courses/edit/:courseId" element={<CourseForm />} />
      <Route path="/admin/courses/content/:courseId" element={<CourseContentPage />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      
      {/* Creator Routes */}
      <Route path="/creator/dashboard" element={<CreatorDashboard />} />
      <Route path="/creator/courses" element={<CreatorCourses />} />
      <Route path="/creator/events" element={<CreatorEvents />} />
      <Route path="/creator/courses/create" element={<CreatorCourseForm />} />
      <Route path="/creator/courses/edit/:courseId" element={<CreatorCourseForm />} />
      <Route path="/creator/courses/content/:courseId" element={<CourseContentPage />} />
      <Route path="/creator/events/create" element={<CreatorEventForm />} />
      <Route path="/creator/events/edit/:eventId" element={<CreatorEventForm />} />
      <Route path="/creator/events/registrations/:eventId" element={<CreatorEventRegistrations />} />
      <Route path="/admin/events/registrations/:eventId" element={<AdminEventRegistrations />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
