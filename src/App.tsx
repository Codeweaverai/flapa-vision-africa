import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import SigninPage from '@/pages/SigninPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyPage from '@/pages/VerifyPage';
import AccountPage from '@/pages/AccountPage';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import CreatorSettings from '@/pages/creator/CreatorSettings';
import EventDetailsPage from '@/pages/EventDetailsPage';
import CourseDetailsPage from '@/pages/CourseDetailsPage';
import TicketVerificationPage from '@/pages/TicketVerificationPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminLogin from '@/pages/admin/AdminLogin';
import PWAComponents from '@/components/PWAComponents';
import CreatorLayout from '@/components/creator/CreatorLayout';
import CreatorWorkplaces from '@/pages/creator/CreatorWorkplaces';
import AccessDeniedPage from '@/pages/AccessDeniedPage';
import { WorkplaceProvider } from '@/contexts/WorkplaceContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <AuthProvider>
          <WorkplaceProvider>
            <CartProvider>
              <div className="App">
                <Toaster />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/signin" element={<SigninPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify" element={<VerifyPage />} />

                  <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                  <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorLayout><CreatorDashboard /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/courses" element={<ProtectedRoute><CreatorLayout><CreatorCourses /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/events" element={<ProtectedRoute><CreatorLayout><CreatorEvents /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/workplaces" element={<ProtectedRoute><CreatorLayout><CreatorWorkplaces /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/students" element={<ProtectedRoute><CreatorLayout><CreatorStudents /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/payments" element={<ProtectedRoute><CreatorLayout><CreatorPayments /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/analytics" element={<ProtectedRoute><CreatorLayout><CreatorAnalytics /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/creator/settings" element={<ProtectedRoute><CreatorLayout><CreatorSettings /></CreatorLayout></ProtectedRoute>} />
                  <Route path="/event/:eventId" element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />
                  <Route path="/course/:courseId" element={<ProtectedRoute><CourseDetailsPage /></ProtectedRoute>} />
                  <Route path="/ticket-verification" element={<ProtectedRoute><TicketVerificationPage /></ProtectedRoute>} />

                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                  <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
                  <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  
                  <Route path="/access-denied" element={<AccessDeniedPage />} />
                </Routes>
                <PWAComponents />
              </div>
            </CartProvider>
          </WorkplaceProvider>
        </AuthProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;
