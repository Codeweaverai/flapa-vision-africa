import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/learning/CourseDetailPage';
import CourseLearningPage from '@/pages/learning/CourseLearningPage';
import LearningPage from '@/pages/LearningPage';
import PricingPage from '@/pages/PricingPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AnimationsPage from '@/pages/AnimationsPage';
import CommunityPage from '@/pages/CommunityPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminEventCreate from '@/pages/admin/AdminEventCreate';
import AdminEventEdit from '@/pages/admin/AdminEventEdit';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminCourseCreate from '@/pages/admin/AdminCourseCreate';
import AdminCourseEdit from '@/pages/admin/AdminCourseEdit';
import AdminCourseContent from '@/pages/admin/AdminCourseContent';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorCourseCreate from '@/pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from '@/pages/creator/CreatorCourseEdit';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorEventCreate from '@/pages/creator/CreatorEventCreate';
import CreatorEventEdit from '@/pages/creator/CreatorEventEdit';
import CreatorEventSpeakers from '@/pages/creator/CreatorEventSpeakers';
import CreatorEventAgenda from '@/pages/creator/CreatorEventAgenda';
import CreatorCourseContent from '@/pages/creator/CreatorCourseContent';
import EventRegistrations from '@/pages/admin/EventRegistrations';
import CreatorEventRegistrations from '@/pages/creator/CreatorEventRegistrations';
import NotFoundPage from '@/pages/NotFoundPage';

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const { authInitialized } = useAuth();

  if (!authInitialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPostPage />} />
        <Route path="/animations" element={<AnimationsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/create"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEventCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/edit/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEventEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/registrations/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <EventRegistrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/create"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCourseCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/edit/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCourseEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/content/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCourseContent />
            </ProtectedRoute>
          }
        />

        {/* Creator routes */}
        <Route path="/creator/dashboard" element={<CreatorDashboard />} />
        <Route path="/creator/courses" element={<CreatorCourses />} />
        <Route path="/creator/courses/create" element={<CreatorCourseCreate />} />
        <Route path="/creator/courses/edit/:id" element={<CreatorCourseEdit />} />
        <Route path="/creator/courses/content/:id" element={<CreatorCourseContent />} />
        <Route path="/creator/events" element={<CreatorEvents />} />
        <Route path="/creator/events/create" element={<CreatorEventCreate />} />
        <Route path="/creator/events/edit/:id" element={<CreatorEventEdit />} />
        <Route path="/creator/events/:id/speakers" element={<CreatorEventSpeakers />} />
        <Route path="/creator/events/:id/agenda" element={<CreatorEventAgenda />} />
        <Route path="/creator/events/registrations/:id" element={<CreatorEventRegistrations />} />

        {/* Learning routes */}
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/learning/course/:id" element={<CourseDetailPage />} />
        <Route path="/learning/course/:id/learn" element={<CourseLearningPage />} />

        {/* Not found route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
