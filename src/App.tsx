import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';

// Page imports
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';
import LearningPage from '@/pages/LearningPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MyEventsPage from '@/pages/MyEventsPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import SpeakingPage from '@/pages/SpeakingPage';
import ConsultPage from '@/pages/ConsultPage';
import MediaPage from '@/pages/MediaPage';
import MediaPostDetailPage from '@/pages/MediaPostDetailPage';
import AnimationsPage from '@/pages/AnimationsPage';
import VenturesPage from '@/pages/VenturesPage';
import CommunityPage from '@/pages/CommunityPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import BecomeCreatorPage from '@/pages/BecomeCreatorPage';
import CareersPage from '@/pages/careers';
import LearnOurCulturePage from '@/pages/LearnOurCulturePage';
import PricingPage from '@/pages/PricingPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AccountPage from '@/pages/AccountPage';
import NotificationsPage from '@/pages/NotificationsPage';
import InboxPage from '@/pages/InboxPage';
import SettingsPage from '@/pages/SettingsPage';

// User Account Pages
import UserProfile from '@/pages/account/UserProfile';
import UserCourses from '@/pages/account/UserCourses';
import UserEvents from '@/pages/account/UserEvents';
import UserConsultations from '@/pages/account/UserConsultations';
import UserSettings from '@/pages/account/UserSettings';

// Learning Pages
import CourseLearningPage from '@/pages/learning/CourseLearningPage';
import CourseDetailPageNew from '@/pages/learning/CourseDetailPage';

// Community Pages
import CommunityChatPage from '@/pages/CommunityChatPage';
import CommunityCoursesPage from '@/pages/CommunityCoursesPage';
import CommunityNotificationsPage from '@/pages/CommunityNotificationsPage';

// Creator Pages
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorCourseCreate from '@/pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from '@/pages/creator/CreatorCourseEdit';
import CreatorCourseContent from '@/pages/creator/CreatorCourseContent';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorEventCreate from '@/pages/creator/CreatorEventCreate';
import CreatorEventEdit from '@/pages/creator/CreatorEventEdit';
import CreatorEventRegistrations from '@/pages/creator/CreatorEventRegistrations';
import CreatorEventAgenda from '@/pages/creator/CreatorEventAgenda';
import CreatorEventSpeakers from '@/pages/creator/CreatorEventSpeakers';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorSettings from '@/pages/creator/CreatorSettings';
import CreatorPublicProfile from '@/pages/CreatorPublicProfile';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminCourseCreate from '@/pages/admin/AdminCourseCreate';
import AdminCourseEdit from '@/pages/admin/AdminCourseEdit';
import AdminCourseContent from '@/pages/admin/AdminCourseContent';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminEventCreate from '@/pages/admin/AdminEventCreate';
import AdminEventEdit from '@/pages/admin/AdminEventEdit';
import AdminEventRegistrations from '@/pages/admin/AdminEventRegistrations';
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminMediaForm from '@/pages/admin/AdminMediaForm';
import AdminSpeaking from '@/pages/admin/AdminSpeaking';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';

// Payment Pages
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import PaymentResultPage from '@/pages/PaymentResultPage';

import { CartProvider } from '@/contexts/CartContext';
import CheckoutPage from '@/pages/CheckoutPage';

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <QueryClient>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/course/:id" element={<CourseDetailPage />} />
                <Route path="/explore/courses" element={<ExploreCoursesPage />} />
                <Route path="/explore/events" element={<ExploreEventsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/event/:id" element={<EventDetailPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/consult" element={<ConsultPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/media/:id" element={<MediaPostDetailPage />} />
                <Route path="/animations" element={<AnimationsPage />} />
                <Route path="/ventures" element={<VenturesPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/become-creator" element={<BecomeCreatorPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/learn-our-culture" element={<LearnOurCulturePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />

                {/* Creator Public Profile */}
                <Route path="/creator/profile/:creatorId" element={<CreatorPublicProfile />} />

                {/* Protected Routes */}
                <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="/account/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/account/courses" element={<ProtectedRoute><UserCourses /></ProtectedRoute>} />
                <Route path="/account/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
                <Route path="/account/consultations" element={<ProtectedRoute><UserConsultations /></ProtectedRoute>} />
                <Route path="/account/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
                <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />

                {/* Learning Routes */}
                <Route path="/learning/course/:id" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />
                <Route path="/learning/course-detail/:id" element={<CourseDetailPageNew />} />

                {/* Community Routes */}
                <Route path="/community/chat" element={<ProtectedRoute><CommunityChatPage /></ProtectedRoute>} />
                <Route path="/community/courses" element={<ProtectedRoute><CommunityCoursesPage /></ProtectedRoute>} />
                <Route path="/community/notifications" element={<ProtectedRoute><CommunityNotificationsPage /></ProtectedRoute>} />

                {/* Creator Routes */}
                <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                <Route path="/creator/courses/:id/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                <Route path="/creator/courses/:id/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                <Route path="/creator/events/:id/edit" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                <Route path="/creator/events/:id/registrations" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                <Route path="/creator/events/:id/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                <Route path="/creator/events/:id/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
                <Route path="/admin/courses/create" element={<AdminRoute><AdminCourseCreate /></AdminRoute>} />
                <Route path="/admin/courses/:id/edit" element={<AdminRoute><AdminCourseEdit /></AdminRoute>} />
                <Route path="/admin/courses/:id/content" element={<AdminRoute><AdminCourseContent /></AdminRoute>} />
                <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
                <Route path="/admin/events/create" element={<AdminRoute><AdminEventCreate /></AdminRoute>} />
                <Route path="/admin/events/:id/edit" element={<AdminRoute><AdminEventEdit /></AdminRoute>} />
                <Route path="/admin/events/:id/registrations" element={<AdminRoute><AdminEventRegistrations /></AdminRoute>} />
                <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
                <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/media/:id/edit" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
                <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
                <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                {/* Payment Routes */}
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/payment/result" element={<PaymentResultPage />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </QueryClient>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
