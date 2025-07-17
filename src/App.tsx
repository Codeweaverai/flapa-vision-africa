
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthPage from '@/pages/AuthPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import SigninPage from '@/pages/SigninPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyPage from '@/pages/VerifyPage';

// Currency
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Cart
import { CartProvider } from '@/contexts/CartContext';
import CartPage from '@/pages/cart/CartPage';

// Public Pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import CoursesPage from '@/pages/CoursesPage';
import EventsPage from '@/pages/EventsPage';
import MediaPage from '@/pages/MediaPage';
import MediaPostDetailPage from '@/pages/MediaPostDetailPage';
import SpeakingPage from '@/pages/SpeakingPage';
import ConsultPage from '@/pages/ConsultPage';
import VenturesPage from '@/pages/VenturesPage';
import PricingPage from '@/pages/PricingPage';
import CreatorsPage from '@/pages/CreatorsPage';
import CreatorPublicProfile from '@/pages/CreatorPublicProfile';
import LearnOurCulturePage from '@/pages/LearnOurCulturePage';
import BecomeCreatorPage from '@/pages/BecomeCreatorPage';
import AnimationsPage from '@/pages/AnimationsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Course Pages
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseEnrollmentPage from '@/pages/CourseEnrollmentPage';
import CourseLearningPage from '@/pages/CourseLearningPage';
import CoursePlayerPage from '@/pages/CoursePlayerPage';
import LessonPage from '@/pages/LessonPage';
import CourseResultsPage from '@/pages/CourseResultsPage';

// Event Pages
import EventDetailPage from '@/pages/EventDetailPage';
import EventRegistrationPage from '@/pages/EventRegistrationPage';

// Explore Pages
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';

// Job Pages
import JobDetailPage from '@/pages/JobDetailPage';

// Payment Pages
import CheckoutPage from '@/pages/CheckoutPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import CheckoutSuccessPage from '@/pages/CheckoutSuccessPage';

// Ticket Pages
import TicketDetailPage from '@/pages/TicketDetailPage';
import TicketPage from '@/pages/TicketPage';
import TicketViewPage from '@/pages/TicketViewPage';

// User Pages
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import AccountPage from '@/pages/AccountPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MyEventsPage from '@/pages/MyEventsPage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import LearningPage from '@/pages/LearningPage';
import MessagesPage from '@/pages/MessagesPage';
import InboxPage from '@/pages/InboxPage';
import NotificationsPage from '@/pages/NotificationsPage';

// User Account Pages
import UserProfile from '@/pages/account/UserProfile';
import UserCourses from '@/pages/account/UserCourses';
import UserEvents from '@/pages/account/UserEvents';
import UserOrders from '@/pages/account/UserOrders';
import UserConsultations from '@/pages/account/UserConsultations';
import UserSettings from '@/pages/account/UserSettings';

// Community Pages
import CommunityPage from '@/pages/CommunityPage';
import CommunityChatPage from '@/pages/CommunityChatPage';
import CommunityCoursesPage from '@/pages/CommunityCoursesPage';
import CommunityNotificationsPage from '@/pages/CommunityNotificationsPage';

// Creator Pages
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
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
import CreatorEventTickets from '@/pages/creator/CreatorEventTickets';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorPromoCodes from '@/pages/creator/CreatorPromoCodes';
import CreatorSettings from '@/pages/creator/CreatorSettings';

// Admin Pages
import AdminRoute from '@/components/admin/AdminRoute';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminCourseCreate from '@/pages/admin/AdminCourseCreate';
import AdminCourseEdit from '@/pages/admin/AdminCourseEdit';
import AdminCourseContent from '@/pages/admin/AdminCourseContent';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminEventCreate from '@/pages/admin/AdminEventCreate';
import AdminEventEdit from '@/pages/admin/AdminEventEdit';
import AdminEventRegistrations from '@/pages/admin/AdminEventRegistrations';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminMediaForm from '@/pages/admin/AdminMediaForm';
import AdminNewsletters from '@/pages/admin/AdminNewsletters';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminSpeaking from '@/pages/admin/AdminSpeaking';
import AdminCareers from '@/pages/admin/AdminCareers';
import AdminContactSubmissions from '@/pages/admin/AdminContactSubmissions';
import AdminSupportInbox from '@/pages/admin/AdminSupportInbox';
import AdminPayouts from '@/pages/admin/AdminPayouts';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <QueryClientProvider client={queryClient}>
              <Toaster />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/media/:id" element={<MediaPostDetailPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/consult" element={<ConsultPage />} />
                <Route path="/ventures" element={<VenturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/creators" element={<CreatorsPage />} />
                <Route path="/creator/profile/:id" element={<CreatorPublicProfile />} />
                <Route path="/learn-culture" element={<LearnOurCulturePage />} />
                <Route path="/become-creator" element={<BecomeCreatorPage />} />
                <Route path="/animations" element={<AnimationsPage />} />

                {/* Course Routes */}
                <Route path="/course/:courseId" element={<CourseDetailPage />} />
                <Route path="/learning/course/:courseId" element={<CourseDetailPage />} />
                <Route path="/course/:courseId/enroll" element={<CourseEnrollmentPage />} />
                <Route path="/course/:courseId/learn" element={<CourseLearningPage />} />
                <Route path="/course/:courseId/player" element={<CoursePlayerPage />} />
                <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
                <Route path="/course/:courseId/results" element={<CourseResultsPage />} />

                {/* Event Routes */}
                <Route path="/event/:eventId" element={<EventDetailPage />} />
                <Route path="/event/:eventId/register" element={<EventRegistrationPage />} />

                {/* Explore Routes */}
                <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                <Route path="/explore-events" element={<ExploreEventsPage />} />
                <Route path="/explore/courses" element={<ExploreCoursesPage />} />
                <Route path="/explore/events" element={<ExploreEventsPage />} />

                {/* Job Routes */}
                <Route path="/job/:jobId" element={<JobDetailPage />} />

                {/* Auth Routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/signin" element={<SigninPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/verify" element={<VerifyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify" element={<VerifyPage />} />

                {/* Payment Routes */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

                {/* Cart Routes */}
                <Route path="/cart" element={<CartPage />} />

                {/* Ticket Routes */}
                <Route path="/ticket/:ticketId" element={<TicketDetailPage />} />
                <Route path="/tickets/:ticketId" element={<TicketPage />} />
                <Route path="/tickets/:ticketId/view" element={<TicketViewPage />} />

                {/* Protected User Routes */}
                <Route element={<ProtectedRoute><div /></ProtectedRoute>}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/my-courses" element={<MyCoursesPage />} />
                  <Route path="/my-events" element={<MyEventsPage />} />
                  <Route path="/my-orders" element={<MyOrdersPage />} />
                  <Route path="/learning" element={<LearningPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  
                  {/* User Account Pages */}
                  <Route path="/account/profile" element={<UserProfile />} />
                  <Route path="/account/courses" element={<UserCourses />} />
                  <Route path="/account/events" element={<UserEvents />} />
                  <Route path="/account/orders" element={<UserOrders />} />
                  <Route path="/account/consultations" element={<UserConsultations />} />
                  <Route path="/account/settings" element={<UserSettings />} />

                  {/* Community Routes */}
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/community/chat" element={<CommunityChatPage />} />
                  <Route path="/community/courses" element={<CommunityCoursesPage />} />
                  <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
                </Route>

                {/* Creator Routes */}
                <Route element={<ProtectedRoute><div /></ProtectedRoute>}>
                  <Route path="/creator/dashboard" element={<CreatorDashboard />} />
                  <Route path="/creator/analytics" element={<CreatorAnalytics />} />
                  <Route path="/creator/courses" element={<CreatorCourses />} />
                  <Route path="/creator/courses/create" element={<CreatorCourseCreate />} />
                  <Route path="/creator/courses/edit/:id" element={<CreatorCourseEdit />} />
                  <Route path="/creator/courses/content/:id" element={<CreatorCourseContent />} />
                  <Route path="/creator/events" element={<CreatorEvents />} />
                  <Route path="/creator/events/create" element={<CreatorEventCreate />} />
                  <Route path="/creator/events/:id/edit" element={<CreatorEventEdit />} />
                  <Route path="/creator/events/:id/registrations" element={<CreatorEventRegistrations />} />
                  <Route path="/creator/events/:id/agenda" element={<CreatorEventAgenda />} />
                  <Route path="/creator/events/:id/speakers" element={<CreatorEventSpeakers />} />
                  <Route path="/creator/events/:id/tickets" element={<CreatorEventTickets />} />
                  <Route path="/creator/students" element={<CreatorStudents />} />
                  <Route path="/creator/payments" element={<CreatorPayments />} />
                  <Route path="/creator/promo-codes" element={<CreatorPromoCodes />} />
                  <Route path="/creator/settings" element={<CreatorSettings />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="courses" element={<AdminCourses />} />
                      <Route path="courses/create" element={<AdminCourseCreate />} />
                      <Route path="courses/:id/edit" element={<AdminCourseEdit />} />
                      <Route path="courses/:id/content" element={<AdminCourseContent />} />
                      <Route path="events" element={<AdminEvents />} />
                      <Route path="events/create" element={<AdminEventCreate />} />
                      <Route path="events/:id/edit" element={<AdminEventEdit />} />
                      <Route path="events/:id/registrations" element={<AdminEventRegistrations />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="media" element={<AdminMedia />} />
                      <Route path="media/create" element={<AdminMediaForm />} />
                      <Route path="media/:id/edit" element={<AdminMediaForm />} />
                      <Route path="newsletters" element={<AdminNewsletters />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="registrations" element={<AdminRegistrations />} />
                      <Route path="consultations" element={<AdminConsultations />} />
                      <Route path="speaking" element={<AdminSpeaking />} />
                      <Route path="careers" element={<AdminCareers />} />
                      <Route path="contact" element={<AdminContactSubmissions />} />
                      <Route path="support" element={<AdminSupportInbox />} />
                      <Route path="payouts" element={<AdminPayouts />} />
                    </Routes>
                  </AdminRoute>
                } />

                <Route path="/admin/login" element={<AdminLogin />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </QueryClientProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
