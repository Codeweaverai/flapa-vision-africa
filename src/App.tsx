
import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

// Public Pages
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import LearningPage from './pages/LearningPage';
import SpeakingPage from './pages/SpeakingPage';
import VenturesPage from './pages/VenturesPage';
import AnimationsPage from './pages/AnimationsPage';
import MediaPage from './pages/MediaPage';
import MediaPostDetailPage from './pages/MediaPostDetailPage';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import ExploreEventsPage from './pages/ExploreEventsPage';
import ConsultPage from './pages/ConsultPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import CourseLearningPage from './pages/CourseLearningPage';
import EventDetailPage from './pages/EventDetailPage';
import AccountPage from './pages/AccountPage';
import NotFoundPage from './pages/NotFoundPage';
import HelpCenterPage from './pages/HelpCenterPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentResultPage from './pages/PaymentResultPage';

// Community Pages
import CommunityPage from './pages/CommunityPage';
import CommunityChatPage from './pages/CommunityChatPage';
import CommunityCoursesPage from './pages/CommunityCoursesPage';
import CommunityNotificationsPage from './pages/CommunityNotificationsPage';

// Admin Pages
import AdminRoute from './components/admin/AdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminEventRegistrations from './pages/admin/AdminEventRegistrations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminMedia from './pages/admin/AdminMedia';
import AdminMediaForm from './pages/admin/AdminMediaForm';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSpeaking from './pages/admin/AdminSpeaking';

// Creator Pages
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorCourseForm from './pages/creator/CreatorCourseForm';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorEventForm from './pages/creator/CreatorEventForm';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import CreatorStudents from './pages/creator/CreatorStudents';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorPayments from './pages/creator/CreatorPayments';

// User Account Pages
import UserCourses from './pages/account/UserCourses';
import UserEvents from './pages/account/UserEvents';
import UserConsultations from './pages/account/UserConsultations';
import UserProfile from './pages/account/UserProfile';
import UserSettings from './pages/account/UserSettings';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/speaking" element={<SpeakingPage />} />
        <Route path="/ventures" element={<VenturesPage />} />
        <Route path="/animations" element={<AnimationsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/media/:id" element={<MediaPostDetailPage />} />
        <Route path="/courses" element={<ExploreCoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/course/:id/learn" element={<CourseLearningPage />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<CoursePlayerPage />} />
        <Route path="/events" element={<ExploreEventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/consult" element={<ConsultPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />
        
        {/* User Account routes */}
        <Route path="/account/courses" element={<UserCourses />} />
        <Route path="/account/events" element={<UserEvents />} />
        <Route path="/account/consultations" element={<UserConsultations />} />
        <Route path="/account/profile" element={<UserProfile />} />
        <Route path="/account/settings" element={<UserSettings />} />
        
        {/* Community routes */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/chat" element={<CommunityChatPage />} />
        <Route path="/community/courses" element={<CommunityCoursesPage />} />
        <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
        <Route path="/admin/events/create" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
        <Route path="/admin/events/edit/:id" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
        <Route path="/admin/events/:id/registrations" element={<AdminRoute><AdminEventRegistrations /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
        <Route path="/admin/courses/create" element={<AdminRoute><AdminCourseForm /></AdminRoute>} />
        <Route path="/admin/courses/edit/:id" element={<AdminRoute><AdminCourseForm /></AdminRoute>} />
        <Route path="/admin/courses/:id/content" element={<AdminRoute><AdminCourseContent /></AdminRoute>} />
        <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
        <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
        <Route path="/admin/media/edit/:id" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
        <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
        <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
        <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        
        {/* Creator routes */}
        <Route path="/creator" element={<CreatorDashboard />} />
        <Route path="/creator/analytics" element={<CreatorAnalytics />} />
        <Route path="/creator/courses" element={<CreatorCourses />} />
        <Route path="/creator/courses/new" element={<CreatorCourseForm />} />
        <Route path="/creator/courses/edit/:id" element={<CreatorCourseForm />} />
        <Route path="/creator/events" element={<CreatorEvents />} />
        <Route path="/creator/events/new" element={<CreatorEventForm />} />
        <Route path="/creator/events/edit/:id" element={<CreatorEventForm />} />
        <Route path="/creator/events/:id/registrations" element={<CreatorEventRegistrations />} />
        <Route path="/creator/students" element={<CreatorStudents />} />
        <Route path="/creator/settings" element={<CreatorSettings />} />
        <Route path="/creator/payments" element={<CreatorPayments />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
      <SonnerToaster position="top-right" />
    </>
  );
}

export default App;
