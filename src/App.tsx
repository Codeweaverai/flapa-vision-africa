
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import EventsPage from '@/pages/EventsPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import EventDetailPage from '@/pages/EventDetailPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AccountPage from '@/pages/AccountPage';
import AdminRoute from '@/components/admin/AdminRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminCourseCreate from '@/pages/admin/AdminCourseCreate';
import AdminEventCreate from '@/pages/admin/AdminEventCreate';
import AdminCourseEdit from '@/pages/admin/AdminCourseEdit';
import AdminEventEdit from '@/pages/admin/AdminEventEdit';
import ProtectedRoute from '@/components/ProtectedRoute';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SigninPage from '@/pages/SigninPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import AuthPage from '@/pages/AuthPage';
import { Toaster } from 'sonner';
import OTPManager from '@/components/auth/OTPManager';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <Toaster />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />

                <Route path="/account" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />

                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/courses" element={
                  <AdminRoute>
                    <AdminCourses />
                  </AdminRoute>
                } />
                <Route path="/admin/events" element={
                  <AdminRoute>
                    <AdminEvents />
                  </AdminRoute>
                } />
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } />
                <Route path="/admin/courses/create" element={
                  <AdminRoute>
                    <AdminCourseCreate />
                  </AdminRoute>
                } />
                <Route path="/admin/events/create" element={
                  <AdminRoute>
                    <AdminEventCreate />
                  </AdminRoute>
                } />
                <Route path="/admin/courses/edit/:courseId" element={
                  <AdminRoute>
                    <AdminCourseEdit />
                  </AdminRoute>
                } />
                <Route path="/admin/events/edit/:eventId" element={
                  <AdminRoute>
                    <AdminEventEdit />
                  </AdminRoute>
                } />
              </Routes>

              {/* Global OTP Verification Modal */}
              <OTPManager />
            </Router>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
