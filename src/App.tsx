
import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/admin/AdminRoute";

// Import all pages
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import EventsPage from "./pages/EventsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LearningPage from "./pages/LearningPage";
import AccountPage from "./pages/AccountPage";
import CheckoutPage from "./pages/CheckoutPage";
import CourseDetailPage from "./pages/learning/CourseDetailPage";
import EventDetailPage from "./pages/EventDetailPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import MyEventsPage from "./pages/MyEventsPage";
import ConsultPage from "./pages/ConsultPage";
import SpeakingPage from "./pages/SpeakingPage";
import BecomeCreatorPage from "./pages/BecomeCreatorPage";
import CreatorPublicProfile from "./pages/CreatorPublicProfile";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import CourseLearningPage from "./pages/learning/CourseLearningPage";
import MediaPage from "./pages/MediaPage";
import MediaPostDetailPage from "./pages/MediaPostDetailPage";
import VenturesPage from "./pages/VenturesPage";
import AnimationsPage from "./pages/AnimationsPage";
import NotFoundPage from "./pages/NotFoundPage";
import CommunityPage from "./pages/CommunityPage";
import CommunityChatPage from "./pages/CommunityChatPage";
import CommunityCoursesPage from "./pages/CommunityCoursesPage";
import CommunityNotificationsPage from "./pages/CommunityNotificationsPage";
import InboxPage from "./pages/InboxPage";
import NotificationsPage from "./pages/NotificationsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import CourseResultsPage from "./pages/CourseResultsPage";
import ExploreCoursesPage from "./pages/ExploreCoursesPage";
import ExploreEventsPage from "./pages/ExploreEventsPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import CareersPage from "./pages/careers";
import JobDetailPage from "./pages/JobDetailPage";
import TicketPage from "./pages/TicketPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import LearnOurCulturePage from "./pages/LearnOurCulturePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyPage from "./pages/VerifyPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CreatorsPage from "./pages/CreatorsPage";

// User Account Pages
import UserProfile from "./pages/account/UserProfile";
import UserCourses from "./pages/account/UserCourses";
import UserEvents from "./pages/account/UserEvents";
import UserConsultations from "./pages/account/UserConsultations";
import UserOrders from "./pages/account/UserOrders";
import UserSettings from "./pages/account/UserSettings";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseCreate from "./pages/admin/AdminCourseCreate";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import AdminCourseContent from "./pages/admin/AdminCourseContent";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminEventCreate from "./pages/admin/AdminEventCreate";
import AdminEventEdit from "./pages/admin/AdminEventEdit";
import AdminEventRegistrations from "./pages/admin/AdminEventRegistrations";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminMediaForm from "./pages/admin/AdminMediaForm";
import AdminSupportInbox from "./pages/admin/AdminSupportInbox";
import AdminConsultations from "./pages/admin/AdminConsultations";
import AdminSpeaking from "./pages/admin/AdminSpeaking";
import AdminCareers from "./pages/admin/AdminCareers";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOrders from "./pages/admin/AdminOrders";

// Creator Pages
import CreatorDashboard from "./pages/creator/CreatorDashboard";
import CreatorCourses from "./pages/creator/CreatorCourses";
import CreatorCourseCreate from "./pages/creator/CreatorCourseCreate";
import CreatorCourseEdit from "./pages/creator/CreatorCourseEdit";
import CreatorCourseContent from "./pages/creator/CreatorCourseContent";
import CreatorEvents from "./pages/creator/CreatorEvents";
import CreatorEventCreate from "./pages/creator/CreatorEventCreate";
import CreatorEventEdit from "./pages/creator/CreatorEventEdit";
import CreatorEventRegistrations from "./pages/creator/CreatorEventRegistrations";
import CreatorEventAgenda from "./pages/creator/CreatorEventAgenda";
import CreatorEventSpeakers from "./pages/creator/CreatorEventSpeakers";
import CreatorStudents from "./pages/creator/CreatorStudents";
import CreatorAnalytics from "./pages/creator/CreatorAnalytics";
import CreatorPayments from "./pages/creator/CreatorPayments";
import CreatorSettings from "./pages/creator/CreatorSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/learning/course-detail/:id" element={<CourseDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/event-detail/:eventId" element={<EventDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/consult" element={<ConsultPage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/become-creator" element={<BecomeCreatorPage />} />
                <Route path="/creator/profile/:id" element={<CreatorPublicProfile />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/media/:id" element={<MediaPostDetailPage />} />
                <Route path="/ventures" element={<VenturesPage />} />
                <Route path="/animations" element={<AnimationsPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/chat" element={<CommunityChatPage />} />
                <Route path="/community/courses" element={<CommunityCoursesPage />} />
                <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
                <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                <Route path="/explore-events" element={<ExploreEventsPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/ticket/:id" element={<TicketDetailPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/tickets" element={<TicketPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/learn-our-culture" element={<LearnOurCulturePage />} />
                <Route path="/creators" element={<CreatorsPage />} />

                {/* Protected Routes */}
                <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="/account/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/account/courses" element={<ProtectedRoute><UserCourses /></ProtectedRoute>} />
                <Route path="/account/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
                <Route path="/account/consultations" element={<ProtectedRoute><UserConsultations /></ProtectedRoute>} />
                <Route path="/account/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                <Route path="/account/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
                <Route path="/course/:id/play" element={<ProtectedRoute><CoursePlayerPage /></ProtectedRoute>} />
                <Route path="/course/:id/learn" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />
                <Route path="/course/:id/results" element={<ProtectedRoute><CourseResultsPage /></ProtectedRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Learning Routes - Fixed to remove duplicates */}
                <Route path="/learning/course/:courseId" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />

                {/* Creator Routes */}
                <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                <Route path="/creator/courses/:id/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                <Route path="/creator/courses/:id/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                <Route path="/creator/events/edit/:eventId" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                <Route path="/creator/events/registrations/:eventId" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                <Route path="/creator/events/:eventId/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
                <Route path="/admin/courses/create" element={<AdminRoute><AdminCourseCreate /></AdminRoute>} />
                <Route path="/admin/courses/:id/edit" element={<AdminRoute><AdminCourseEdit /></AdminRoute>} />
                <Route path="/admin/courses/:id/content" element={<AdminRoute><AdminCourseContent /></AdminRoute>} />
                <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
                <Route path="/admin/events/create" element={<AdminRoute><AdminEventCreate /></AdminRoute>} />
                <Route path="/admin/events/edit/:eventId" element={<AdminRoute><AdminEventEdit /></AdminRoute>} />
                <Route path="/admin/events/registrations/:eventId" element={<AdminRoute><AdminEventRegistrations /></AdminRoute>} />
                <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
                <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/media/edit/:id" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
                <Route path="/admin/support-inbox" element={<AdminRoute><AdminSupportInbox /></AdminRoute>} />
                <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
                <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
                <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
                <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
