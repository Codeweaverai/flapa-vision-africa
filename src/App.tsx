
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import HomePage from './pages/HomePage';
import Index from './pages/Index';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/learning/CourseDetailPage';
import CourseLearningPage from './pages/learning/CourseLearningPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import CourseResultsPage from './pages/CourseResultsPage';
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
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import SettingsPage from './pages/SettingsPage';
import AnimationsPage from './pages/AnimationsPage';
import AuthPage from './pages/AuthPage';
import BecomeCreatorPage from './pages/BecomeCreatorPage';
import CommunityChatPage from './pages/CommunityChatPage';
import CommunityCoursesPage from './pages/CommunityCoursesPage';
import CommunityNotificationsPage from './pages/CommunityNotificationsPage';
import CommunityPage from './pages/CommunityPage';
import ConsultPage from './pages/ConsultPage';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import CreatorsPage from './pages/CreatorsPage';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import ExploreEventsPage from './pages/ExploreEventsPage';
import InboxPage from './pages/InboxPage';
import JobDetailPage from './pages/JobDetailPage';
import LearnOurCulturePage from './pages/LearnOurCulturePage';
import LearningPage from './pages/LearningPage';
import MediaPage from './pages/MediaPage';
import MediaPostDetailPage from './pages/MediaPostDetailPage';
import MyCoursesPage from './pages/MyCoursesPage';
import MyEventsPage from './pages/MyEventsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import SigninPage from './pages/SigninPage';
import SpeakingPage from './pages/SpeakingPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TicketPage from './pages/TicketPage';
import TicketViewPage from './pages/TicketViewPage';
import VenturesPage from './pages/VenturesPage';
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
import CreatorCourseForm from './pages/creator/CreatorCourseForm';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorEventForm from './pages/creator/CreatorEventForm';
import CreatorEventAgenda from './pages/creator/CreatorEventAgenda';
import CreatorEventSpeakers from './pages/creator/CreatorEventSpeakers';
import CreatorEventTickets from './pages/creator/CreatorEventTickets';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import CreatorPayments from './pages/creator/CreatorPayments';
import CreatorPromoCodes from './pages/creator/CreatorPromoCodes';
import CreatorStudents from './pages/creator/CreatorStudents';
import EventAgenda from './pages/creator/EventAgenda';
import EventSpeakers from './pages/creator/EventSpeakers';
import LearningCourseDetailPage from './pages/learning/CourseDetailPage';
import LearningCourseLearningPage from './pages/learning/CourseLearningPage';
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
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminEventForm from './pages/admin/AdminEventForm';
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
import AdminCareers from './pages/admin/AdminCareers';
import AdminLogin from './pages/admin/AdminLogin';
import CourseContentPage from './pages/admin/CourseContentPage';
import CourseForm from './pages/admin/CourseForm';
import EventForm from './pages/admin/EventForm';
import EventRegistrations from './pages/admin/EventRegistrations';
import LessonFormDialog from './pages/admin/LessonFormDialog';
import MediaForm from './pages/admin/MediaForm';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import CareersPage from './pages/careers';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SmartAdvisorFloatingButton from './components/ai/SmartAdvisorFloatingButton';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Toaster />
              <SmartAdvisorFloatingButton />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/learning/course-detail/:id" element={<CourseDetailPage />} />
                <Route path="/learning/course/:id" element={<CourseLearningPage />} />
                <Route path="/courses/:id/player" element={<CoursePlayerPage />} />
                <Route path="/courses/:id/results" element={<CourseResultsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<HelpCenterPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/careers/:id" element={<JobDetailPage />} />
                <Route path="/animations" element={<AnimationsPage />} />
                <Route path="/become-creator" element={<BecomeCreatorPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/chat" element={<CommunityChatPage />} />
                <Route path="/community/courses" element={<CommunityCoursesPage />} />
                <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
                <Route path="/consult" element={<ConsultPage />} />
                <Route path="/creators" element={<CreatorsPage />} />
                <Route path="/creator/:id" element={<CreatorPublicProfile />} />
                <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                <Route path="/explore-events" element={<ExploreEventsPage />} />
                <Route path="/learn-our-culture" element={<LearnOurCulturePage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/learning/courses/:id" element={<LearningCourseDetailPage />} />
                <Route path="/learning/courses/:id/learn" element={<LearningCourseLearningPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/event-detail/:id" element={<EventDetailPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/media/:id" element={<MediaPostDetailPage />} />
                <Route path="/my-courses" element={<MyCoursesPage />} />
                <Route path="/my-events" element={<MyEventsPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/tickets" element={<TicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/tickets/:id/view" element={<TicketViewPage />} />
                <Route path="/ventures" element={<VenturesPage />} />

                {/* Auth Routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/email-verification" element={<VerifyPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/logout" element={<LoginPage />} />

                {/* User Routes */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/user" element={<AuthRoute><AccountPage /></AuthRoute>} />
                <Route path="/user/dashboard" element={<AuthRoute><AccountPage /></AuthRoute>} />
                <Route path="/user/profile" element={<AuthRoute><UserProfile /></AuthRoute>} />
                <Route path="/user/courses" element={<AuthRoute><UserCourses /></AuthRoute>} />
                <Route path="/user/events" element={<AuthRoute><UserEvents /></AuthRoute>} />
                <Route path="/user/orders" element={<AuthRoute><UserOrders /></AuthRoute>} />
                <Route path="/user/reviews" element={<AuthRoute><ProfilePage /></AuthRoute>} />
                <Route path="/user/settings" element={<AuthRoute><UserSettings /></AuthRoute>} />
                <Route path="/user/consultations" element={<AuthRoute><UserConsultations /></AuthRoute>} />

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
                <Route path="/creator/events/:id/agenda" element={<CreatorRoute><CreatorEventAgenda /></CreatorRoute>} />
                <Route path="/creator/events/:id/speakers" element={<CreatorRoute><CreatorEventSpeakers /></CreatorRoute>} />
                <Route path="/creator/events/:id/tickets" element={<CreatorRoute><CreatorEventTickets /></CreatorRoute>} />
                <Route path="/creator/events/:id/registrations" element={<CreatorRoute><CreatorEventRegistrations /></CreatorRoute>} />
                <Route path="/creator/analytics" element={<CreatorRoute><CreatorAnalytics /></CreatorRoute>} />
                <Route path="/creator/settings" element={<CreatorRoute><CreatorSettings /></CreatorRoute>} />
                <Route path="/creator/payments" element={<CreatorRoute><CreatorPayments /></CreatorRoute>} />
                <Route path="/creator/promo-codes" element={<CreatorRoute><CreatorPromoCodes /></CreatorRoute>} />
                <Route path="/creator/students" element={<CreatorRoute><CreatorStudents /></CreatorRoute>} />

                {/* Cart and Checkout */}
                <Route path="/cart" element={<CheckoutPage />} />
                <Route path="/checkout" element={<AuthRoute><CheckoutPage /></AuthRoute>} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
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
                <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />

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
