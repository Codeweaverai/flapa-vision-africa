
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import HelpCenterPage from './pages/HelpCenterPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import UserProfile from './pages/account/UserProfile';
import UserCourses from './pages/account/UserCourses';
import UserEvents from './pages/account/UserEvents';
import UserOrders from './pages/account/UserOrders';
import UserSettings from './pages/account/UserSettings';
import UserConsultations from './pages/account/UserConsultations';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorCourseCreate from './pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from './pages/creator/CreatorCourseEdit';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import CreatorPayments from './pages/creator/CreatorPayments';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyPage from './pages/VerifyPage';
import AuthRoute from './components/ProtectedRoute';
import CreatorRoute from './components/ProtectedRoute';
import AdminRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseCreate from './pages/admin/AdminCourseCreate';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminEventRegistrations from './pages/admin/AdminEventRegistrations';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminMedia from './pages/admin/AdminMedia';
import AdminMediaForm from './pages/admin/AdminMediaForm';
import AdminNewsletters from './pages/admin/AdminNewsletters';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminContactSubmissions from './pages/admin/AdminContactSubmissions';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminSpeaking from './pages/admin/AdminSpeaking';
import AdminSupportInbox from './pages/admin/AdminSupportInbox';
import AdminPayouts from './pages/admin/AdminPayouts';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreatorLayout from './components/creator/CreatorLayout';
import AdminLayout from './components/admin/AdminLayout';
import AdminSidebar from './components/admin/AdminSidebar';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Toaster />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<HelpCenterPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/email-verification" element={<VerifyPage />} />
                <Route path="/logout" element={<LoginPage />} />

                {/* User Routes */}
                <Route path="/user" element={<AuthRoute><AccountPage /></AuthRoute>} />
                <Route path="/user/dashboard" element={<AuthRoute><AccountPage /></AuthRoute>} />
                <Route path="/user/profile" element={<AuthRoute><UserProfile /></AuthRoute>} />
                <Route path="/user/courses" element={<AuthRoute><UserCourses /></AuthRoute>} />
                <Route path="/user/events" element={<AuthRoute><UserEvents /></AuthRoute>} />
                <Route path="/user/orders" element={<AuthRoute><UserOrders /></AuthRoute>} />
                <Route path="/user/reviews" element={<AuthRoute><ProfilePage /></AuthRoute>} />
                <Route path="/user/settings" element={<AuthRoute><UserSettings /></AuthRoute>} />

                {/* Creator Routes */}
                <Route path="/creator" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
                <Route path="/creator/dashboard" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
                <Route path="/creator/courses" element={<CreatorRoute><CreatorCourses /></CreatorRoute>} />
                <Route path="/creator/courses/create" element={<CreatorRoute><CreatorCourseCreate /></CreatorRoute>} />
                <Route path="/creator/courses/:id/edit" element={<CreatorRoute><CreatorCourseEdit /></CreatorRoute>} />
                <Route path="/creator/courses/:id/content" element={<CreatorRoute><CreatorCourseContent /></CreatorRoute>} />
                <Route path="/creator/events" element={<CreatorRoute><CreatorEvents /></CreatorRoute>} />
                <Route path="/creator/events/create" element={<CreatorRoute><CreatorEventCreate /></CreatorRoute>} />
                <Route path="/creator/events/:id/edit" element={<CreatorRoute><CreatorEventEdit /></CreatorRoute>} />
                <Route path="/creator/events/:id/registrations" element={<CreatorRoute><CreatorEventRegistrations /></CreatorRoute>} />
                <Route path="/creator/analytics" element={<CreatorRoute><CreatorAnalytics /></CreatorRoute>} />
                <Route path="/creator/settings" element={<CreatorRoute><CreatorSettings /></CreatorRoute>} />
                <Route path="/creator/payments" element={<CreatorRoute><CreatorPayments /></CreatorRoute>} />

                {/* Cart and Checkout */}
                <Route path="/cart" element={<CheckoutPage />} />
                <Route path="/checkout" element={<AuthRoute><CheckoutPage /></AuthRoute>} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
                <Route path="/admin/courses/create" element={<AdminRoute><AdminCourseCreate /></AdminRoute>} />
                <Route path="/admin/courses/:id/edit" element={<AdminRoute><AdminCourseEdit /></AdminRoute>} />
                <Route path="/admin/courses/:id/content" element={<AdminRoute><AdminCourseContent /></AdminRoute>} />
                <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
                <Route path="/admin/events/create" element={<AdminRoute><AdminEventCreate /></AdminRoute>} />
                <Route path="/admin/events/:id/edit" element={<AdminRoute><AdminEventEdit /></AdminRoute>} />
                <Route path="/admin/events/:id/registrations" element={<AdminRoute><AdminEventRegistrations /></AdminRoute>} />
                <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
                <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
                <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/media/:id/edit" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/newsletters" element={<AdminRoute><AdminNewsletters /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/contact-submissions" element={<AdminRoute><AdminContactSubmissions /></AdminRoute>} />
                <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
                <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
                <Route path="/admin/support-inbox" element={<AdminRoute><AdminSupportInbox /></AdminRoute>} />
                <Route path="/admin/payouts" element={<AdminRoute><AdminPayouts /></AdminRoute>} />

                {/* Catch-all route for 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
