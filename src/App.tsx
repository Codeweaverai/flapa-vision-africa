import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import ProfilePage from './pages/ProfilePage';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCoursePage from './pages/creator/CreatorCoursePage';
import CreatorEventPage from './pages/creator/CreatorEventPage';
import CommunityCoursesPage from './pages/CommunityCoursesPage';
import CourseEnrollmentPage from './pages/CourseEnrollmentPage';
import SpeakingPage from './pages/SpeakingPage';
import SpeakingBookingPage from './pages/SpeakingBookingPage';
import AuthProvider from '@/contexts/AuthContext';
import CurrencyProvider from '@/contexts/CurrencyContext';
import CartProvider from '@/contexts/CartContext';
import PWAComponents from '@/components/pwa/PWAComponents';
import PricingPage from '@/pages/PricingPage';
import CreatorProfilePage from '@/pages/CreatorProfilePage';
import EditProfilePage from '@/pages/EditProfilePage';
import ContactPage from '@/pages/ContactPage';
import AboutPage from '@/pages/AboutPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import CookiePolicyPage from '@/pages/CookiePolicyPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PasswordResetPage from '@/pages/PasswordResetPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import OTPVerificationPage from '@/pages/OTPVerificationPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import SuccessPage from '@/pages/SuccessPage';
import CancelPage from '@/pages/CancelPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import CreatorStorePage from '@/pages/CreatorStorePage';
import WishlistPage from '@/pages/WishlistPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <div className="App">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId" element={<EventDetailsPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route path="/creator/dashboard" element={<CreatorDashboard />} />
                <Route path="/creator/courses" element={<CreatorCoursePage />} />
                <Route path="/creator/events" element={<CreatorEventPage />} />
                <Route path="/community/courses" element={<CommunityCoursesPage />} />
                <Route path="/courses/:courseId/enroll" element={<CourseEnrollmentPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/speaking/book" element={<SpeakingBookingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/creator/profile/:creatorId" element={<CreatorProfilePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/reset-password" element={<PasswordResetPage />} />
                <Route path="/verify-email" element={<EmailVerificationPage />} />
                <Route path="/verify-otp" element={<OTPVerificationPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/cancel" element={<CancelPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:postId" element={<BlogPostPage />} />
                <Route path="/store/:creatorId" element={<CreatorStorePage />} />
                
                {/* Add wishlist route */}
                <Route path="/wishlist" element={<WishlistPage />} />
                
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <PWAComponents />
            </div>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
