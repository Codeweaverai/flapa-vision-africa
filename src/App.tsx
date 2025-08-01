
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/sonner';
import HomePage from '@/pages/HomePage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import EventDetailPage from '@/pages/EventDetailPage';
import LearningPage from '@/pages/LearningPage';
import ProfilePage from '@/pages/ProfilePage';
import AuthPage from '@/pages/AuthPage';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminRoute from '@/components/admin/AdminRoute';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorRoute from '@/components/creator/CreatorRoute';
import PaymentResultPage from '@/pages/PaymentResultPage';
import CreatorAttendeesPage from '@/pages/creator/CreatorAttendeesPage';
import PricingPage from '@/pages/PricingPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import ContactPage from '@/pages/ContactPage';
import AboutUsPage from '@/pages/AboutUsPage';
import EventListingPage from '@/pages/EventListingPage';
import CourseListingPage from '@/pages/CourseListingPage';
import AccountSettingsPage from '@/pages/AccountSettingsPage';
import OrdersPage from '@/pages/OrdersPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/learning/course-detail/:courseId" element={<CourseDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/payment/result" element={<PaymentResultPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/events" element={<EventListingPage />} />
                <Route path="/courses" element={<CourseListingPage />} />
                <Route path="/account/settings" element={<AccountSettingsPage />} />
                <Route path="/account/orders" element={<OrdersPage />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/creator" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
                <Route path="/creator/attendees" element={<CreatorRoute><CreatorAttendeesPage /></CreatorRoute>} />
                
                {/* Add new route for invitation acceptance */}
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
                
              </Routes>
            </BrowserRouter>
            <Toaster />
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
