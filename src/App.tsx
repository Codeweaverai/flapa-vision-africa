
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Import all pages
import Index from './pages/Index';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import AnimationsPage from './pages/AnimationsPage';
import AuthPage from './pages/AuthPage';
import BecomeCreatorPage from './pages/BecomeCreatorPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CommunityChatPage from './pages/CommunityChatPage';
import CommunityCoursesPage from './pages/CommunityCoursesPage';
import CommunityNotificationsPage from './pages/CommunityNotificationsPage';
import CommunityPage from './pages/CommunityPage';
import ConsultPage from './pages/ConsultPage';
import ContactPage from './pages/ContactPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import CourseResultsPage from './pages/CourseResultsPage';
import CoursesPage from './pages/CoursesPage';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import CreatorsPage from './pages/CreatorsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventsPage from './pages/EventsPage';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import ExploreEventsPage from './pages/ExploreEventsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HelpCenterPage from './pages/HelpCenterPage';
import InboxPage from './pages/InboxPage';
import JobDetailPage from './pages/JobDetailPage';
import LearnOurCulturePage from './pages/LearnOurCulturePage';
import LearningPage from './pages/LearningPage';
import LoginPage from './pages/LoginPage';
import MediaPage from './pages/MediaPage';
import MediaPostDetailPage from './pages/MediaPostDetailPage';
import MyCoursesPage from './pages/MyCoursesPage';
import MyEventsPage from './pages/MyEventsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PricingPage from './pages/PricingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import SigninPage from './pages/SigninPage';
import SpeakingPage from './pages/SpeakingPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import TicketPage from './pages/TicketPage';
import TicketViewPage from './pages/TicketViewPage';
import VenturesPage from './pages/VenturesPage';
import VerifyPage from './pages/VerifyPage';
import CareersPage from './pages/careers';

// Learning pages
import CourseLearningPage from './pages/learning/CourseLearningPage';
import CourseEnrollmentPage from './pages/CourseEnrollmentPage';
import LessonPage from './pages/LessonPage';
import MessagesPage from './pages/MessagesPage';
import CartPage from './pages/cart/CartPage';

// Creator pages
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorCourseCreate from './pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from './pages/creator/CreatorCourseEdit';
import CreatorCourseForm from './pages/creator/CreatorCourseForm';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorEventAgenda from './pages/creator/CreatorEventAgenda';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorEventForm from './pages/creator/CreatorEventForm';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import CreatorEventSpeakers from './pages/creator/CreatorEventSpeakers';
import CreatorEventTickets from './pages/creator/CreatorEventTickets';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorPayments from './pages/creator/CreatorPayments';
import CreatorPromoCodes from './pages/creator/CreatorPromoCodes';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorStudents from './pages/creator/CreatorStudents';
import EventAgenda from './pages/creator/EventAgenda';
import EventSpeakers from './pages/creator/EventSpeakers';

// Admin pages
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCareers from './pages/admin/AdminCareers';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminContactSubmissions from './pages/admin/AdminContactSubmissions';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminCourseCreate from './pages/admin/AdminCourseCreate';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminCourses from './pages/admin/AdminCourses';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminEventRegistrations from './pages/admin/AdminEventRegistrations';
import AdminEvents from './pages/admin/AdminEvents';
import AdminLogin from './pages/admin/AdminLogin';
import AdminMedia from './pages/admin/AdminMedia';
import AdminMediaForm from './pages/admin/AdminMediaForm';
import AdminNewsletters from './pages/admin/AdminNewsletters';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSpeaking from './pages/admin/AdminSpeaking';
import AdminSupportInbox from './pages/admin/AdminSupportInbox';
import AdminUsers from './pages/admin/AdminUsers';
import CourseContentPage from './pages/admin/CourseContentPage';
import CourseForm from './pages/admin/CourseForm';
import EventForm from './pages/admin/EventForm';
import EventRegistrations from './pages/admin/EventRegistrations';
import LessonFormDialog from './pages/admin/LessonFormDialog';
import MediaForm from './pages/admin/MediaForm';

// Account pages
import UserConsultations from './pages/account/UserConsultations';
import UserCourses from './pages/account/UserCourses';
import UserEvents from './pages/account/UserEvents';
import UserOrders from './pages/account/UserOrders';
import UserProfile from './pages/account/UserProfile';
import UserSettings from './pages/account/UserSettings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <div className="App">
                <Toaster />
                <Routes>
                  {/* Main pages */}
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/animations" element={<AnimationsPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/become-creator" element={<BecomeCreatorPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/community/chat" element={<CommunityChatPage />} />
                  <Route path="/community/courses" element={<CommunityCoursesPage />} />
                  <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
                  <Route path="/consult" element={<ConsultPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/course/:courseId" element={<CourseDetailPage />} />
                  <Route path="/course/:courseId/player" element={<CoursePlayerPage />} />
                  <Route path="/course/:courseId/results" element={<CourseResultsPage />} />
                  <Route path="/course/:courseId/enroll" element={<CourseEnrollmentPage />} />
                  <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
                  <Route path="/creators" element={<CreatorsPage />} />
                  <Route path="/creator/profile/:creatorId" element={<CreatorPublicProfile />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/event-detail/:id" element={<EventDetailPage />} />
                  <Route path="/explore/courses" element={<ExploreCoursesPage />} />
                  <Route path="/explore/events" element={<ExploreEventsPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/help" element={<HelpCenterPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/job/:id" element={<JobDetailPage />} />
                  <Route path="/culture" element={<LearnOurCulturePage />} />
                  <Route path="/learning" element={<LearningPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/media" element={<MediaPage />} />
                  <Route path="/media/:id" element={<MediaPostDetailPage />} />
                  <Route path="/messages/:userId" element={<MessagesPage />} />
                  <Route path="/my-courses" element={<MyCoursesPage />} />
                  <Route path="/my-events" element={<MyEventsPage />} />
                  <Route path="/my-orders" element={<MyOrdersPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/signin" element={<SigninPage />} />
                  <Route path="/speaking" element={<SpeakingPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/ticket/:id" element={<TicketPage />} />
                  <Route path="/ticket/view/:id" element={<TicketViewPage />} />
                  <Route path="/ventures" element={<VenturesPage />} />
                  <Route path="/verify" element={<VerifyPage />} />
                  <Route path="/careers" element={<CareersPage />} />

                  {/* Learning routes */}
                  <Route path="/course/:courseId/learn" element={<CourseLearningPage />} />

                  {/* Creator routes */}
                  <Route path="/creator/dashboard" element={<CreatorDashboard />} />
                  <Route path="/creator/analytics" element={<CreatorAnalytics />} />
                  <Route path="/creator/courses" element={<CreatorCourses />} />
                  <Route path="/creator/courses/create" element={<CreatorCourseCreate />} />
                  <Route path="/creator/courses/:id/edit" element={<CreatorCourseEdit />} />
                  <Route path="/creator/courses/:id/content" element={<CreatorCourseContent />} />
                  <Route path="/creator/events" element={<CreatorEvents />} />
                  <Route path="/creator/events/create" element={<CreatorEventCreate />} />
                  <Route path="/creator/events/:id/edit" element={<CreatorEventEdit />} />
                  <Route path="/creator/events/:id/agenda" element={<CreatorEventAgenda />} />
                  <Route path="/creator/events/:id/speakers" element={<CreatorEventSpeakers />} />
                  <Route path="/creator/events/:id/tickets" element={<CreatorEventTickets />} />
                  <Route path="/creator/events/:id/registrations" element={<CreatorEventRegistrations />} />
                  <Route path="/creator/payments" element={<CreatorPayments />} />
                  <Route path="/creator/promo-codes" element={<CreatorPromoCodes />} />
                  <Route path="/creator/students" element={<CreatorStudents />} />
                  <Route path="/creator/settings" element={<CreatorSettings />} />

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/careers" element={<AdminCareers />} />
                  <Route path="/admin/consultations" element={<AdminConsultations />} />
                  <Route path="/admin/contact-submissions" element={<AdminContactSubmissions />} />
                  <Route path="/admin/courses" element={<AdminCourses />} />
                  <Route path="/admin/courses/create" element={<AdminCourseCreate />} />
                  <Route path="/admin/courses/:id/edit" element={<AdminCourseEdit />} />
                  <Route path="/admin/courses/:id/content" element={<AdminCourseContent />} />
                  <Route path="/admin/events" element={<AdminEvents />} />
                  <Route path="/admin/events/create" element={<AdminEventCreate />} />
                  <Route path="/admin/events/:id/edit" element={<AdminEventEdit />} />
                  <Route path="/admin/events/:id/registrations" element={<AdminEventRegistrations />} />
                  <Route path="/admin/media" element={<AdminMedia />} />
                  <Route path="/admin/newsletters" element={<AdminNewsletters />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/payouts" element={<AdminPayouts />} />
                  <Route path="/admin/registrations" element={<AdminRegistrations />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/speaking" element={<AdminSpeaking />} />
                  <Route path="/admin/support" element={<AdminSupportInbox />} />
                  <Route path="/admin/users" element={<AdminUsers />} />

                  {/* Account routes */}
                  <Route path="/account/profile" element={<UserProfile />} />
                  <Route path="/account/courses" element={<UserCourses />} />
                  <Route path="/account/events" element={<UserEvents />} />
                  <Route path="/account/orders" element={<UserOrders />} />
                  <Route path="/account/consultations" element={<UserConsultations />} />
                  <Route path="/account/settings" element={<UserSettings />} />

                  {/* 404 route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </Router>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
