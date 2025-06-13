
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminEventRegistrations from './pages/admin/AdminEventRegistrations';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminCourseCreate from './pages/admin/AdminCourseCreate';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSpeaking from './pages/admin/AdminSpeaking';
import AdminMedia from './pages/admin/AdminMedia';
import AdminMediaForm from './pages/admin/AdminMediaForm';
import AdminLogin from './pages/admin/AdminLogin';
import CourseContentPage from './pages/admin/CourseContentPage';
import CourseForm from './pages/admin/CourseForm';
import EventForm from './pages/admin/EventForm';
import EventRegistrations from './pages/admin/EventRegistrations';
import MediaForm from './pages/admin/MediaForm';

// Creator Pages
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorStudents from './pages/creator/CreatorStudents';
import CreatorPayments from './pages/creator/CreatorPayments';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorCourseCreate from './pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from './pages/creator/CreatorCourseEdit';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorEventAgenda from './pages/creator/CreatorEventAgenda';
import CreatorEventSpeakers from './pages/creator/CreatorEventSpeakers';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';

// Public Pages
import AccountPage from './pages/AccountPage';
import LearningPage from './pages/LearningPage';
import CourseLearningPage from './pages/learning/CourseLearningPage';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import InboxPage from './pages/InboxPage';
import CourseResultsPage from './pages/CourseResultsPage';
import CommunityPage from './pages/CommunityPage';
import CommunityNotificationsPage from './pages/CommunityNotificationsPage';
import CommunityChatPage from './pages/CommunityChatPage';
import MediaPage from './pages/MediaPage';
import MediaPostDetailPage from './pages/MediaPostDetailPage';

// Additional Pages
import EventDetailPage from './pages/EventDetailPage';
import EventsPage from './pages/EventsPage';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import ExploreEventsPage from './pages/ExploreEventsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import MyCoursesPage from './pages/MyCoursesPage';
import MyEventsPage from './pages/MyEventsPage';
import CareersPage from './pages/careers';
import VerifyPage from './pages/VerifyPage';
import TicketPage from './pages/TicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import SigninPage from './pages/SigninPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import BecomeCreatorPage from './pages/BecomeCreatorPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentResultPage from './pages/PaymentResultPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import NotificationsPage from './pages/NotificationsPage';
import CourseDetailPage from './pages/learning/CourseDetailPage';
import CoursesPage from './pages/CoursesPage';
import AnimationsPage from './pages/AnimationsPage';
import LearnOurCulturePage from './pages/LearnOurCulturePage';

// Account Pages
import UserConsultations from './pages/account/UserConsultations';
import UserCourses from './pages/account/UserCourses';
import UserEvents from './pages/account/UserEvents';
import UserOrders from './pages/account/UserOrders';
import UserProfile from './pages/account/UserProfile';
import UserSettings from './pages/account/UserSettings';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<LoginPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signin" element={<SigninPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/payment-result" element={<PaymentResultPage />} />
                  <Route path="/payment-cancel" element={<PaymentCancelPage />} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/learn-our-culture" element={<LearnOurCulturePage />} />
                  <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
                  <Route path="/learning/course/:courseId" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />
                  <Route path="/learning/course-detail/:Id" element={<CourseDetailPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                  <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/event/:eventId" element={<EventDetailPage />} />
                  <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
                  <Route path="/explore-events" element={<ExploreEventsPage />} />
                  <Route path="/creator/:creatorId" element={<CreatorPublicProfile />} />
                  <Route path="/become-creator" element={<BecomeCreatorPage />} />
                  <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/course-results" element={<ProtectedRoute><CourseResultsPage /></ProtectedRoute>} />
                  <Route path="/course/:Id/results" element={<ProtectedRoute><CourseResultsPage /></ProtectedRoute>} />
                  <Route path="/results" element={<ProtectedRoute><CourseResultsPage /></ProtectedRoute>} />
                  <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                  <Route path="/community/notifications" element={<ProtectedRoute><CommunityNotificationsPage /></ProtectedRoute>} />
                  <Route path="/community/chat" element={<ProtectedRoute><CommunityChatPage /></ProtectedRoute>} />
                  <Route path="/media" element={<MediaPage />} />
                  <Route path="/media/:id" element={<MediaPostDetailPage />} />
                  <Route path="/verify" element={<VerifyPage />} />
                  <Route path="/ticket/:ticketId" element={<TicketPage />} />
                  <Route path="/ticket-detail/:ticketId" element={<TicketDetailPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/help" element={<HelpCenterPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/animations" element={<AnimationsPage />} />

                  {/* Account Routes */}
                  <Route path="/account/consultations" element={<ProtectedRoute><UserConsultations /></ProtectedRoute>} />
                  <Route path="/account/courses" element={<ProtectedRoute><UserCourses /></ProtectedRoute>} />
                  <Route path="/account/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
                  <Route path="/account/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                  <Route path="/account/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/account/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />

                  {/* Creator Routes */}
                  <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                  <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                  <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                  <Route path="/creator/courses/:courseId/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                  <Route path="/creator/courses/:courseId/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                  <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                  <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/edit" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/registrations" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                  <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                  <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                  <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                  <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/consultations" element={<ProtectedRoute><AdminConsultations /></ProtectedRoute>} />
                  <Route path="/admin/speaking" element={<ProtectedRoute><AdminSpeaking /></ProtectedRoute>} />
                  <Route path="/admin/registrations" element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                  <Route path="/admin/media" element={<ProtectedRoute><AdminMedia /></ProtectedRoute>} />
                  <Route path="/admin/media/create" element={<ProtectedRoute><AdminMediaForm /></ProtectedRoute>} />
                  <Route path="/admin/media/:id/edit" element={<ProtectedRoute><AdminMediaForm /></ProtectedRoute>} />
                  <Route path="/admin/media/form" element={<ProtectedRoute><MediaForm /></ProtectedRoute>} />

                  {/* Admin Course Routes */}
                  <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
                  <Route path="/admin/courses/create" element={<ProtectedRoute><AdminCourseCreate /></ProtectedRoute>} />
                  <Route path="/admin/courses/form" element={<ProtectedRoute><AdminCourseForm /></ProtectedRoute>} />
                  <Route path="/admin/courses/:courseId" element={<ProtectedRoute><CourseForm /></ProtectedRoute>} />
                  <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute><AdminCourseEdit /></ProtectedRoute>} />
                  <Route path="/admin/courses/:courseId/content" element={<ProtectedRoute><AdminCourseContent /></ProtectedRoute>} />
                  <Route path="/admin/course-content" element={<ProtectedRoute><CourseContentPage /></ProtectedRoute>} />

                  {/* Admin Event Routes */}
                  <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
                  <Route path="/admin/events/create" element={<ProtectedRoute><AdminEventCreate /></ProtectedRoute>} />
                  <Route path="/admin/events/form" element={<ProtectedRoute><AdminEventForm /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId/edit" element={<ProtectedRoute><AdminEventEdit /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId/registrations" element={<ProtectedRoute><AdminEventRegistrations /></ProtectedRoute>} />
                  <Route path="/admin/event-registrations" element={<ProtectedRoute><EventRegistrations /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Toaster />
              </div>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
