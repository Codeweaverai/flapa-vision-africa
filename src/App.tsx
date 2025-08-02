
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import EventsPage from '@/pages/EventsPage';
import CourseDetailsPage from '@/pages/CourseDetailsPage';
import EventDetailsPage from '@/pages/EventDetailsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AccountPage from '@/pages/AccountPage';
import AdminRoute from '@/components/admin/AdminRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminLogin from '@/pages/admin/AdminLogin';
import CreateCoursePage from '@/pages/admin/CreateCoursePage';
import CreateEventPage from '@/pages/admin/CreateEventPage';
import EditCoursePage from '@/pages/admin/EditCoursePage';
import EditEventPage from '@/pages/admin/EditEventPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SigninPage from '@/pages/SigninPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import AuthPage from '@/pages/AuthPage';
import { Toaster } from 'sonner';
import OTPVerificationModal from '@/components/auth/OTPVerificationModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const queryClient = new QueryClient();

function App() {
  const { otpRequired, verificationType, user, setOtpRequired } = useAuth();

  const handleOTPVerified = () => {
    setOtpRequired(false);
    toast.success('Email verified successfully!');
  };

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
                <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
                <Route path="/events/:eventId" element={<EventDetailsPage />} />
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
                    <CreateCoursePage />
                  </AdminRoute>
                } />
                <Route path="/admin/events/create" element={
                  <AdminRoute>
                    <CreateEventPage />
                  </AdminRoute>
                } />
                <Route path="/admin/courses/edit/:courseId" element={
                  <AdminRoute>
                    <EditCoursePage />
                  </AdminRoute>
                } />
                <Route path="/admin/events/edit/:eventId" element={
                  <AdminRoute>
                    <EditEventPage />
                  </AdminRoute>
                } />
              </Routes>

              {/* Global OTP Verification Modal */}
              {otpRequired && user && verificationType && (
                <OTPVerificationModal
                  isOpen={otpRequired}
                  onClose={() => {}}
                  onVerified={handleOTPVerified}
                  verificationType={verificationType}
                  userEmail={user.email || ''}
                />
              )}
            </Router>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
