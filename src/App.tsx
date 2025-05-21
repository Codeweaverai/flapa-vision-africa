
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
import MediaPostDetailPage from '@/pages/MediaPostDetailPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminSettings from '@/pages/admin/AdminSettings';
import EventForm from '@/pages/admin/EventForm';
import CourseForm from '@/pages/admin/CourseForm';
import CourseContentPage from '@/pages/admin/CourseContentPage';
import AdminMedia from '@/pages/admin/AdminMedia';
import MediaForm from '@/pages/admin/MediaForm';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorCourseForm from '@/pages/creator/CreatorCourseForm';
import CreatorEventForm from '@/pages/creator/CreatorEventForm';
import CreatorEventRegistrations from '@/pages/creator/CreatorEventRegistrations';
import AdminEventRegistrations from '@/pages/admin/AdminEventRegistrations';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import AdminLogin from '@/pages/admin/AdminLogin';
// Import new explore pages
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';
// Import community pages
import CommunityPage from '@/pages/CommunityPage';
import CommunityChatPage from '@/pages/CommunityChatPage';
import CommunityCoursesPage from '@/pages/CommunityCoursesPage';
import CommunityNotificationsPage from '@/pages/CommunityNotificationsPage';

// Import route guard components
import AdminRoute from '@/components/admin/AdminRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/media" element={<MediaPage />} />
      <Route path="/media/:id" element={<MediaPostDetailPage />} />
      <Route path="/consult" element={<ConsultPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/learning" element={<LearningPage />} />
      <Route path="/learning/course/:courseId" element={<CourseDetailPage />} />
      <Route path="/learning/player/:courseId" element={<CourseLearningPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      
      {/* New explore routes */}
      <Route path="/explore/courses" element={<ExploreCoursesPage />} />
      <Route path="/explore/events" element={<ExploreEventsPage />} />
      
      {/* Community routes */}
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/community/chat" element={<CommunityChatPage />} />
      <Route path="/community/courses" element={<CommunityCoursesPage />} />
      <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/admin/consultations" element={
        <AdminRoute>
          <AdminConsultations />
        </AdminRoute>
      } />
      <Route path="/admin/events" element={
        <AdminRoute>
          <AdminEvents />
        </AdminRoute>
      } />
      <Route path="/admin/events/create" element={
        <AdminRoute>
          <EventForm />
        </AdminRoute>
      } />
      <Route path="/admin/events/edit/:eventId" element={
        <AdminRoute>
          <EventForm />
        </AdminRoute>
      } />
      <Route path="/admin/courses" element={
        <AdminRoute>
          <AdminCourses />
        </AdminRoute>
      } />
      <Route path="/admin/courses/create" element={
        <AdminRoute>
          <CourseForm />
        </AdminRoute>
      } />
      <Route path="/admin/courses/edit/:courseId" element={
        <AdminRoute>
          <CourseForm />
        </AdminRoute>
      } />
      <Route path="/admin/courses/content/:courseId" element={
        <AdminRoute>
          <CourseContentPage />
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminUsers />
        </AdminRoute>
      } />
      <Route path="/admin/settings" element={
        <AdminRoute>
          <AdminSettings />
        </AdminRoute>
      } />
      <Route path="/admin/media" element={
        <AdminRoute>
          <AdminMedia />
        </AdminRoute>
      } />
      <Route path="/admin/media/create" element={
        <AdminRoute>
          <MediaForm />
        </AdminRoute>
      } />
      <Route path="/admin/media/edit/:id" element={
        <AdminRoute>
          <MediaForm />
        </AdminRoute>
      } />
      <Route path="/admin/registrations" element={
        <AdminRoute>
          <AdminRegistrations />
        </AdminRoute>
      } />
      <Route path="/admin/events/registrations/:eventId" element={
        <AdminRoute>
          <AdminEventRegistrations />
        </AdminRoute>
      } />
      
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
      <Route path="/creator/students" element={<CreatorStudents />} />
      <Route path="/creator/analytics" element={<CreatorAnalytics />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
