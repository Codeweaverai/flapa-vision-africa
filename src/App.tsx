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
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Outlet />;
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
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/creator/dashboard" element={<CreatorDashboard />} />
        <Route path="/creator/courses" element={<CreatorCourses />} />
        <Route path="/creator/events" element={<CreatorEvents />} />
        <Route path="/creator/students" element={<CreatorStudents />} />
        <Route path="/creator/analytics" element={<CreatorAnalytics />} />
        <Route path="/creator/payments" element={<CreatorPayments />} />
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/media" element={<AdminMedia />} />
        <Route path="/admin/registrations" element={<AdminRegistrations />} />
        <Route path="/admin/consultations" element={<AdminConsultations />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      
      {/* Not found route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
