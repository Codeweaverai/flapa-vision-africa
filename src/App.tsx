import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/admin/AdminRoute";

// Pages
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import MediaPage from "./pages/MediaPage";
import MediaPostDetailPage from "./pages/MediaPostDetailPage";
import CommunityPage from "./pages/CommunityPage";
import CommunityChatPage from "./pages/CommunityChatPage";
import CommunityCoursesPage from "./pages/CommunityCoursesPage";
import CommunityNotificationsPage from "./pages/CommunityNotificationsPage";
import ConsultPage from "./pages/ConsultPage";
import ContactPage from "./pages/ContactPage";
import AuthPage from "./pages/AuthPage";
import LearningPage from "./pages/LearningPage";
import LearningCourseDetailPage from "./pages/learning/CourseDetailPage";
import CourseLearningPage from "./pages/learning/CourseLearningPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import AccountPage from "./pages/AccountPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import MyCoursesPage from "./pages/MyCoursesPage";
import MyEventsPage from "./pages/MyEventsPage";
import NotificationsPage from "./pages/NotificationsPage";
import InboxPage from "./pages/InboxPage";
import InstructorProfilePage from "./pages/InstructorProfilePage";
import HelpCenterPage from "./pages/HelpCenterPage";
import BecomeCreatorPage from "./pages/BecomeCreatorPage";
import SpeakingPage from "./pages/SpeakingPage";
import AnimationsPage from "./pages/AnimationsPage";
import VenturesPage from "./pages/VenturesPage";
import ExploreCoursesPage from "./pages/ExploreCoursesPage";
import ExploreEventsPage from "./pages/ExploreEventsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PricingPage from "./pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import NotFoundPage from "./pages/NotFoundPage";

// User Account pages
import UserProfile from "./pages/account/UserProfile";
import UserCourses from "./pages/account/UserCourses";
import UserEvents from "./pages/account/UserEvents";
import UserConsultations from "./pages/account/UserConsultations";
import UserSettings from "./pages/account/UserSettings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
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
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminSpeaking from "./pages/admin/AdminSpeaking";
import AdminConsultations from "./pages/admin/AdminConsultations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

// Creator pages
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
import CreatorPayments from "./pages/creator/CreatorPayments";
import CreatorStudents from "./pages/creator/CreatorStudents";
import CreatorAnalytics from "./pages/creator/CreatorAnalytics";
import CreatorSettings from "./pages/creator/CreatorSettings";

import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              
              {/* Course routes */}
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/course-player/:id" element={<CoursePlayerPage />} />
              
              {/* Learning routes */}
              <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
              <Route path="/learning/course-detail/:id" element={<ProtectedRoute><LearningCourseDetailPage /></ProtectedRoute>} />
              <Route path="/learning/course/:id" element={<ProtectedRoute><CourseLearningPage /></ProtectedRoute>} />
              
              {/* Event routes */}
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              
              {/* Media routes */}
              <Route path="/media" element={<MediaPage />} />
              <Route path="/media/:id" element={<MediaPostDetailPage />} />
              
              {/* Community routes */}
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/chat" element={<ProtectedRoute><CommunityChatPage /></ProtectedRoute>} />
              <Route path="/community/courses" element={<ProtectedRoute><CommunityCoursesPage /></ProtectedRoute>} />
              <Route path="/community/notifications" element={<ProtectedRoute><CommunityNotificationsPage /></ProtectedRoute>} />
              
              {/* User routes */}
              <Route path="/consult" element={<ConsultPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
              <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
              
              {/* Instructor Profile */}
              <Route path="/instructor/:id" element={<InstructorProfilePage />} />
              
              {/* User Account Sub-routes */}
              <Route path="/account/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/account/courses" element={<ProtectedRoute><UserCourses /></ProtectedRoute>} />
              <Route path="/account/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
              <Route path="/account/consultations" element={<ProtectedRoute><UserConsultations /></ProtectedRoute>} />
              <Route path="/account/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
              
              {/* Other pages */}
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/become-creator" element={<BecomeCreatorPage />} />
              <Route path="/speaking" element={<SpeakingPage />} />
              <Route path="/animations" element={<AnimationsPage />} />
              <Route path="/ventures" element={<VenturesPage />} />
              <Route path="/explore/courses" element={<ExploreCoursesPage />} />
              <Route path="/explore/events" element={<ExploreEventsPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/careers" element={<div>Careers page coming soon</div>} />
              
              {/* Payment routes */}
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
              <Route path="/payment/result" element={<PaymentResultPage />} />
              
              {/* Admin routes */}
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
              <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
              <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
              <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              
              {/* Creator routes */}
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
              <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
              <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
              <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
              <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
