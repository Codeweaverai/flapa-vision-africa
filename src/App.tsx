

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyPage from '@/pages/VerifyPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import CheckoutPage from '@/pages/CheckoutPage';
import CheckoutSuccessPage from '@/pages/CheckoutSuccessPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import CreatorsPage from '@/pages/CreatorsPage';
import CreatorPublicProfile from '@/pages/CreatorPublicProfile';
import ConsultPage from '@/pages/ConsultPage';
import SpeakingPage from '@/pages/SpeakingPage';
import PricingPage from '@/pages/PricingPage';
import MediaPage from '@/pages/MediaPage';
import MediaPostDetailPage from '@/pages/MediaPostDetailPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import CareersPage from '@/pages/careers';
import JobDetailPage from '@/pages/JobDetailPage';
import AboutPage from '@/pages/AboutPage';
import LearnOurCulturePage from '@/pages/LearnOurCulturePage';
import ContactPage from '@/pages/ContactPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import BecomeCreatorPage from '@/pages/BecomeCreatorPage';
import VenturesPage from '@/pages/VenturesPage';
import AnimationsPage from '@/pages/AnimationsPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import TicketViewPage from '@/pages/TicketViewPage';
import AccountPage from '@/pages/AccountPage';
import UserProfile from '@/pages/account/UserProfile';
import UserCourses from '@/pages/account/UserCourses';
import UserEvents from '@/pages/account/UserEvents';
import UserOrders from '@/pages/account/UserOrders';
import UserConsultations from '@/pages/account/UserConsultations';
import UserSettings from '@/pages/account/UserSettings';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MyEventsPage from '@/pages/MyEventsPage';
import LearningPage from '@/pages/LearningPage';
import CourseLearningPage from '@/pages/CourseLearningPage';
import CourseResultsPage from '@/pages/CourseResultsPage';
import CoursePlayerPage from '@/pages/CoursePlayerPage';
import TicketPage from '@/pages/TicketPage';
import CommunityPage from '@/pages/CommunityPage';
import CommunityChatPage from '@/pages/CommunityChatPage';
import CommunityCoursesPage from '@/pages/CommunityCoursesPage';
import CommunityNotificationsPage from '@/pages/CommunityNotificationsPage';
import InboxPage from '@/pages/InboxPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorCourseCreate from '@/pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from '@/pages/creator/CreatorCourseEdit';
import CreatorCourseContent from '@/pages/creator/CreatorCourseContent';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorEventCreate from '@/pages/creator/CreatorEventCreate';
import CreatorEventEdit from '@/pages/creator/CreatorEventEdit';
import CreatorEventRegistrations from '@/pages/creator/CreatorEventRegistrations';
import CreatorEventSpeakers from '@/pages/creator/CreatorEventSpeakers';
import CreatorEventAgenda from '@/pages/creator/CreatorEventAgenda';
import CreatorEventTickets from '@/pages/creator/CreatorEventTickets';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorSettings from '@/pages/creator/CreatorSettings';
import AdminLogin from '@/pages/admin/AdminLogin';
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
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminMediaForm from '@/pages/admin/AdminMediaForm';
import AdminNewsletters from '@/pages/admin/AdminNewsletters';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminSpeaking from '@/pages/admin/AdminSpeaking';
import AdminContactSubmissions from '@/pages/admin/AdminContactSubmissions';
import AdminCareers from '@/pages/admin/AdminCareers';
import AdminSupportInbox from '@/pages/admin/AdminSupportInbox';
import AdminReviews from '@/pages/admin/AdminReviews';
import NotFoundPage from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <CurrencyProvider>
              <Toaster />
              
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/signin" element={<AuthPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/explore" element={<CoursesPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/course/:courseId" element={<CourseDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/event/:eventId" element={<EventDetailPage />} />
                <Route path="/explore-events" element={<ExploreEventsPage />} />
                <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                <Route path="/payment-cancel" element={<PaymentCancelPage />} />
                <Route path="/creators" element={<CreatorsPage />} />
                <Route path="/creator/profile/:creatorId" element={<CreatorPublicProfile />} />
                <Route path="/consult" element={<ConsultPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/media/:postId" element={<MediaPostDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:postId" element={<BlogPostPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/job/:jobId" element={<JobDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/learn-our-culture" element={<LearnOurCulturePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/help-center" element={<HelpCenterPage />} />
                <Route path="/become-creator" element={<BecomeCreatorPage />} />
                <Route path="/ventures" element={<VenturesPage />} />
                <Route path="/automations" element={<AnimationsPage />} />
                <Route path="/ticket/:ticketId" element={<TicketDetailPage />} />
                <Route path="/ticket-view/:ticketId" element={<TicketViewPage />} />

                {/* Protected user routes */}
                <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="/account/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/account/courses" element={<ProtectedRoute><UserCourses /></ProtectedRoute>} />
                <Route path="/account/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
                <Route path="/account/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                <Route path="/account/consultations" element={<ProtectedRoute><UserConsultations /></ProtectedRoute>} />
                <Route path="/account/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
                <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
                <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
                <Route path="/course/:courseId/learn" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />
                <Route path="/course-results/:enrollmentId" element={<ProtectedRoute><CourseResultsPage /></ProtectedRoute>} />
                <Route path="/course/:courseId/player" element={<ProtectedRoute><CoursePlayerPage /></ProtectedRoute>} />
                <Route path="/tickets" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                <Route path="/community/chat" element={<ProtectedRoute><CommunityChatPage /></ProtectedRoute>} />
                <Route path="/community/courses" element={<ProtectedRoute><CommunityCoursesPage /></ProtectedRoute>} />
                <Route path="/community/notifications" element={<ProtectedRoute><CommunityNotificationsPage /></ProtectedRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                {/* Creator routes */}
                <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                <Route path="/creator/courses/:courseId/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                <Route path="/creator/courses/:courseId/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/edit" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/registrations" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/tickets" element={<ProtectedRoute><CreatorEventTickets /></ProtectedRoute>} />
                <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
                <Route path="/admin/courses/create" element={<AdminRoute><AdminCourseCreate /></AdminRoute>} />
                <Route path="/admin/courses/:courseId/edit" element={<AdminRoute><AdminCourseEdit /></AdminRoute>} />
                <Route path="/admin/courses/:courseId/content" element={<AdminRoute><AdminCourseContent /></AdminRoute>} />
                <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
                <Route path="/admin/events/create" element={<AdminRoute><AdminEventCreate /></AdminRoute>} />
                <Route path="/admin/events/:eventId/edit" element={<AdminRoute><AdminEventEdit /></AdminRoute>} />
                <Route path="/admin/events/:eventId/registrations" element={<AdminRoute><AdminEventRegistrations /></AdminRoute>} />
                <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
                <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/newsletters" element={<AdminRoute><AdminNewsletters /></AdminRoute>} />
                <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
                <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
                <Route path="/admin/contact-submissions" element={<AdminRoute><AdminContactSubmissions /></AdminRoute>} />
                <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
                <Route path="/admin/support-inbox" element={<AdminRoute><AdminSupportInbox /></AdminRoute>} />
                <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

            </CurrencyProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;

