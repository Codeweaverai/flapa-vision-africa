
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';

// Import pages
import Index from '@/pages/Index';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyPage from '@/pages/VerifyPage';
import CoursesPage from '@/pages/CoursesPage';
import ExploreCoursesPage from '@/pages/ExploreCoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseEnrollmentPage from '@/pages/CourseEnrollmentPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import LearningPage from '@/pages/LearningPage';
import CourseLearningPage from '@/pages/learning/CourseLearningPage';
import CoursePlayerPage from '@/pages/CoursePlayerPage';
import LessonPage from '@/pages/LessonPage';
import EventsPage from '@/pages/EventsPage';
import ExploreEventsPage from '@/pages/ExploreEventsPage';
import LocalContentPage from '@/pages/LocalContentPage';
import EventDetailPage from '@/pages/EventDetailPage';
import MyEventsPage from '@/pages/MyEventsPage';
import WishlistPage from '@/pages/WishlistPage';
import GiftRedeemPage from './pages/GiftRedeemPage'; 
import GiftCardsPage from './pages/GiftCardsPage';

// Import account pages
import AccountPage from '@/pages/AccountPage';
import UserProfile from '@/pages/account/UserProfile';
import UserSettings from '@/pages/account/UserSettings';
import UserCourses from '@/pages/account/UserCourses';
import UserEvents from '@/pages/account/UserEvents';
import UserConsultations from '@/pages/account/UserConsultations';
import UserOrders from '@/pages/account/UserOrders';

// Import community pages
import CommunityPage from '@/pages/CommunityPage';
import CommunityChatPage from '@/pages/CommunityChatPage';
import CommunityCoursesPage from '@/pages/CommunityCoursesPage';
import CommunityNotificationsPage from '@/pages/CommunityNotificationsPage';

// Import learning pages
import CourseDetailLearningPage from '@/pages/learning/CourseDetailPage';
import CourseLearningPlayerPage from '@/pages/learning/CourseLearningPage';

// Import creator pages
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorCourseCreate from '@/pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from '@/pages/creator/CreatorCourseEdit';
import CreatorCourseContent from '@/pages/creator/CreatorCourseContent';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorEventCreate from '@/pages/creator/CreatorEventCreate';
import CreatorEventEdit from '@/pages/creator/CreatorEventEdit';
import CreatorEventRegistrations from '@/pages/creator/CreatorEventRegistrations';
import CreatorEventAgenda from '@/pages/creator/CreatorEventAgenda';
import CreatorEventSpeakers from '@/pages/creator/CreatorEventSpeakers';
import CreatorEventTickets from '@/pages/creator/CreatorEventTickets';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorPromoCodes from '@/pages/creator/CreatorPromoCodes';
import CreatorSettings from '@/pages/creator/CreatorSettings';
import CreatorAttendeeManagement from '@/pages/creator/CreatorAttendeeManagement';
import CreatorWorkplaces from '@/pages/creator/CreatorWorkplaces';

// Import workplace pages
import AcceptInvitePage from '@/pages/AcceptInvitePage';

// Import admin pages
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
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminMediaForm from '@/pages/admin/AdminMediaForm';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminPayouts from '@/pages/admin/AdminPayouts';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminSpeaking from '@/pages/admin/AdminSpeaking';
import AdminCareers from '@/pages/admin/AdminCareers';
import AdminContactSubmissions from '@/pages/admin/AdminContactSubmissions';
import AdminHelpCenter from '@/pages/admin/AdminHelpCenter';
import AdminSupportInbox from '@/pages/admin/AdminSupportInbox';
import AdminNewsletters from '@/pages/admin/AdminNewsletters';

// Import other pages
import CartPage from '@/pages/cart/CartPage';
import InboxPage from '@/pages/InboxPage';
import NotificationsPage from '@/pages/NotificationsPage';
import MessagesPage from '@/pages/MessagesPage';

// Import missing pages that are used in routes
import CourseResultsPage from '@/pages/CourseResultsPage';
import CheckoutPage from '@/pages/CheckoutPage';
import CheckoutSuccessPage from '@/pages/CheckoutSuccessPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import CreatorsPage from '@/pages/CreatorsPage';
import CreatorPublicProfile from '@/pages/CreatorPublicProfile';
import BecomeCreatorPage from '@/pages/BecomeCreatorPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PricingPage from '@/pages/PricingPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import MediaPage from '@/pages/MediaPage';
import MediaPostDetailPage from '@/pages/MediaPostDetailPage';
import AnimationsPage from '@/pages/AnimationsPage';
import TrendingPage from '@/pages/TrendingPage';
import VenturesPage from '@/pages/VenturesPage';
import LearnOurCulturePage from '@/pages/LearnOurCulturePage';
import ConsultPage from '@/pages/ConsultPage';
import SpeakingPage from '@/pages/SpeakingPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import JobDetailPage from '@/pages/JobDetailPage';
import CareersPage from '@/pages/careers';
import TicketPage from '@/pages/TicketPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import TicketViewPage from '@/pages/TicketViewPage';
import TicketVerificationPage from '@/pages/TicketVerificationPage';
import VerifyCertificatePage from '@/pages/VerifyCertificatePage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Import components
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';
import OTPManager from '@/components/auth/OTPManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<HomePage />} />
                  
                  {/* Auth Routes */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify" element={<VerifyPage />} />

                  {/* Workplace Routes - Fixed to use query parameters */}
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />

                  {/* Course Routes */}
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                  <Route path="/course/:id" element={<CourseDetailPage />} />
                  <Route path="/course/:id/enroll" element={<CourseEnrollmentPage />} />
                  <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                  <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
                  <Route path="/learning/course/:id" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />
                  <Route path="/learning/course-detail/:id" element={<CourseDetailLearningPage />} />
                  <Route path="/learning/course-player/:id" element={<ProtectedRoute><CourseLearningPlayerPage /></ProtectedRoute>} />
                  <Route path="/course/:courseId/play" element={<ProtectedRoute><CoursePlayerPage /></ProtectedRoute>} />
                  <Route path="/lesson/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
                  <Route path="/course/:id/results" element={<ProtectedRoute><CourseResultsPage /></ProtectedRoute>} />

                  {/* Event Routes */}
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/explore-events" element={<ExploreEventsPage />} />
                  <Route path="/local-content" element={<LocalContentPage />} />
                  <Route path="/event-detail/:id" element={<EventDetailPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
                  <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                  <Route path="/gift-cards" element={<GiftCardsPage />} />
                  <Route path="/redeem-gift" element={<GiftRedeemPage />} />

                  {/* Commerce Routes */}
                  <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                  <Route path="/checkout-success" element={<ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>} />
                  <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
                  <Route path="/payment-cancel" element={<ProtectedRoute><PaymentCancelPage /></ProtectedRoute>} />
                  <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />

                  {/* User Account Routes */}
                  <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/account/profile" replace />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="settings" element={<UserSettings />} />
                    <Route path="courses" element={<UserCourses />} />
                    <Route path="events" element={<UserEvents />} />
                    <Route path="consultations" element={<UserConsultations />} />
                    <Route path="orders" element={<UserOrders />} />
                  </Route>
                  
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                  {/* Creator Routes */}
                  <Route path="/creators" element={<CreatorsPage />} />
                  <Route path="/creator/profile/:creatorId" element={<CreatorPublicProfile />} />
                  <Route path="/become-creator" element={<BecomeCreatorPage />} />

                  {/* Protected Creator Routes */}
                  <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                  <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                  <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                  <Route path="/creator/courses/:id/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                  <Route path="/creator/courses/:id/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                  <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                  <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                  <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                  <Route path="/creator/events/:id/edit" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                  <Route path="/creator/events/:id/registrations" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                  <Route path="/creator/events/:id/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                  <Route path="/creator/events/:id/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                  <Route path="/creator/events/:id/tickets" element={<ProtectedRoute><CreatorEventTickets /></ProtectedRoute>} />
                  <Route path="/creator/workplaces" element={<ProtectedRoute><CreatorWorkplaces /></ProtectedRoute>} />
                  <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                  <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                  <Route path="/creator/promo-codes" element={<ProtectedRoute><CreatorPromoCodes /></ProtectedRoute>} />
                  <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />
                  <Route path="/creator/attendees" element={<ProtectedRoute><CreatorAttendeeManagement /></ProtectedRoute>} />

                  {/* Community Routes */}
                  <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                  <Route path="/community/chat" element={<ProtectedRoute><CommunityChatPage /></ProtectedRoute>} />
                  <Route path="/community/courses" element={<ProtectedRoute><CommunityCoursesPage /></ProtectedRoute>} />
                  <Route path="/community/notifications" element={<ProtectedRoute><CommunityNotificationsPage /></ProtectedRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
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
                  <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
                  <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                  <Route path="/admin/media/:id/edit" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                  <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                  <Route path="/admin/payouts" element={<AdminRoute><AdminPayouts /></AdminRoute>} />
                  <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                  <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
                  <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
                  <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
                  <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
                  <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
                  <Route path="/admin/contact" element={<AdminRoute><AdminContactSubmissions /></AdminRoute>} />
                  <Route path="/admin/help-center" element={<AdminRoute><AdminHelpCenter /></AdminRoute>} />
                  <Route path="/admin/support-inbox" element={<AdminRoute><AdminSupportInbox /></AdminRoute>} />
                  <Route path="/admin/newsletters" element={<AdminRoute><AdminNewsletters /></AdminRoute>} />

                  {/* Content Routes */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/media" element={<MediaPage />} />
                  <Route path="/media/:id" element={<MediaPostDetailPage />} />
                  <Route path="/animations" element={<AnimationsPage />} />
                  <Route path="/trending" element={<TrendingPage />} />
                  <Route path="/ventures" element={<VenturesPage />} />
                  <Route path="/learn-our-culture" element={<LearnOurCulturePage />} />
                  <Route path="/consult" element={<ConsultPage />} />
                  <Route path="/speaking" element={<SpeakingPage />} />
                  <Route path="/help" element={<HelpCenterPage />} />
                  <Route path="/job/:id" element={<JobDetailPage />} />
                  <Route path="/careers" element={<CareersPage />} />

                  {/* Ticket Routes */}
                  <Route path="/tickets" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
                  <Route path="/ticket/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />
                  <Route path="/ticket/:id/view" element={<ProtectedRoute><TicketViewPage /></ProtectedRoute>} />
                  <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
                  <Route path="/ticket-verification" element={<TicketVerificationPage />} />

                  {/* Communication Routes */}
                  <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

                  {/* Legal Routes */}
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Toaster />
                
                {/* Global OTP Verification Modal */}
                <OTPManager />
              </div>
            </Router>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
