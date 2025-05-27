
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/learning/CourseDetailPage';
import CourseLearningPage from '@/pages/learning/CourseLearningPage';
import PricingPage from '@/pages/PricingPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import MediaPage from '@/pages/MediaPage';
import CommunityPage from '@/pages/CommunityPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import LearningPage from '@/pages/LearningPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';
import LoginPage from '@/pages/LoginPage';
import SigninPage from '@/pages/SigninPage';
import AuthPage from '@/pages/AuthPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MyEventsPage from '@/pages/MyEventsPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AccountPage from '@/pages/AccountPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminCourseCreate from '@/pages/admin/AdminCourseCreate';
import AdminCourseEdit from '@/pages/admin/AdminCourseEdit';
import AdminCourseContent from '@/pages/admin/AdminCourseContent';
import CourseContentPage from '@/pages/admin/CourseContentPage';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminEventCreate from '@/pages/admin/AdminEventCreate';
import AdminEventEdit from '@/pages/admin/AdminEventEdit';

// Creator Pages
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorCourseCreate from '@/pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from '@/pages/creator/CreatorCourseEdit';
import CreatorCourseContent from '@/pages/creator/CreatorCourseContent';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorEventCreate from '@/pages/creator/CreatorEventCreate';
import CreatorEventEdit from '@/pages/creator/CreatorEventEdit';
import EventSpeakers from '@/pages/creator/EventSpeakers';
import EventAgenda from '@/pages/creator/EventAgenda';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import CreatorSettings from '@/pages/creator/CreatorSettings';
import EventRegistrations from '@/pages/admin/EventRegistrations';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/course-detail/:id" element={<CourseDetailPage />} />
          <Route path="/learning/course/:id" element={<CourseLearningPage />} />
          <Route path="/explore/courses" element={<ExploreCoursesPage />} />
          <Route path="/explore/events" element={<ExploreEventsPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Auth Routes - Multiple paths for same component */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes */}
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
          <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="courses/create" element={<AdminCourseCreate />} />
                <Route path="courses/edit/:id" element={<AdminCourseEdit />} />
                <Route path="courses/content/:id" element={<AdminCourseContent />} />
                <Route path="courses/:courseId" element={<CourseContentPage />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/create" element={<AdminEventCreate />} />
                <Route path="events/edit/:id" element={<AdminEventEdit />} />
                <Route path="events/registrations/:id" element={<EventRegistrations />} />
              </Routes>
            </AdminRoute>
          } />

          {/* Creator Routes */}
          <Route path="/creator/*" element={
            <ProtectedRoute>
              <Routes>
                <Route path="dashboard" element={<CreatorDashboard />} />
                <Route path="courses" element={<CreatorCourses />} />
                <Route path="courses/create" element={<CreatorCourseCreate />} />
                <Route path="courses/edit/:id" element={<CreatorCourseEdit />} />
                <Route path="courses/:id/content" element={<CreatorCourseContent />} />
                <Route path="events" element={<CreatorEvents />} />
                <Route path="events/create" element={<CreatorEventCreate />} />
                <Route path="events/edit/:id" element={<CreatorEventEdit />} />
                <Route path="events/:id/speakers" element={<EventSpeakers />} />
                <Route path="events/:id/agenda" element={<EventAgenda />} />
                <Route path="events/registrations/:id" element={<EventRegistrations />} />
                <Route path="students" element={<CreatorStudents />} />
                <Route path="payments" element={<CreatorPayments />} />
                <Route path="analytics" element={<CreatorAnalytics />} />
                <Route path="settings" element={<CreatorSettings />} />
              </Routes>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
