
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import AuthPage from '@/pages/AuthPage';
import AccountPage from '@/pages/AccountPage';
import EventsPage from '@/pages/EventsPage';
import LearningPage from '@/pages/LearningPage';
import CommunityPage from '@/pages/CommunityPage';
import MediaPage from '@/pages/MediaPage';
import ConsultPage from '@/pages/ConsultPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorCourseForm from '@/pages/creator/CreatorCourseForm';
import CreatorEventForm from '@/pages/creator/CreatorEventForm';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import PaymentResultPage from '@/pages/PaymentResultPage';
import AdminRoute from '@/components/admin/AdminRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminLogin from '@/pages/admin/AdminLogin';
import { useAuth } from '@/contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/learning" element={<LearningPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/media" element={<MediaPage />} />
      <Route path="/consult" element={<ConsultPage />} />
      <Route path="/explore/courses" element={<ExploreCoursesPage />} />
      <Route path="/explore/events" element={<ExploreEventsPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/payment-cancel" element={<PaymentCancelPage />} />
      <Route path="/payment-result" element={<PaymentResultPage />} />
      
      {/* Protected routes */}
      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
      <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseForm /></ProtectedRoute>} />
      <Route path="/creator/courses/edit/:id" element={<ProtectedRoute><CreatorCourseForm /></ProtectedRoute>} />
      <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
      <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventForm /></ProtectedRoute>} />
      <Route path="/creator/events/edit/:id" element={<ProtectedRoute><CreatorEventForm /></ProtectedRoute>} />
      <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
      <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
      <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
      <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
      <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
      <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
      <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      
      {/* Not found route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
