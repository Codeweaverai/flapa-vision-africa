
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import LearningPage from '@/pages/LearningPage';
import CommunityPage from '@/pages/CommunityPage';
import MediaPage from '@/pages/MediaPage';
import ContactPage from '@/pages/ContactPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import AuthPage from '@/pages/AuthPage';
import AccountPage from '@/pages/AccountPage';
import CourseLearningPage from '@/pages/CourseLearningPage';
import CourseDetailPage from '@/pages/learning/CourseDetailPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourseCreate from '@/pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from '@/pages/creator/CreatorCourseEdit';
import CreatorEventCreate from '@/pages/creator/CreatorEventCreate';
import CreatorEventEdit from '@/pages/creator/CreatorEventEdit';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminEvents from '@/pages/admin/AdminEvents';
import PaymentResultPage from '@/pages/PaymentResultPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CommunityCoursesPage from '@/pages/CommunityCoursesPage';
import CommunityNotificationsPage from '@/pages/CommunityNotificationsPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MyEventsPage from '@/pages/MyEventsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentResultPage />} />
            
            {/* Account Routes */}
            <Route path="/account" element={<AccountPage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/my-events" element={<MyEventsPage />} />

            {/* Community Routes */}
            <Route path="/community/courses" element={<CommunityCoursesPage />} />
            <Route path="/community/notifications" element={<CommunityNotificationsPage />} />

            {/* Learning Routes */}
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/learning/course-detail/:id" element={<CourseDetailPage />} />
            <Route path="/learning/course/:id" element={<CourseLearningPage />} />

            {/* Creator Routes */}
            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/course/create" element={<CreatorCourseCreate />} />
            <Route path="/creator/course/edit/:id" element={<CreatorCourseEdit />} />
            <Route path="/creator/event/create" element={<CreatorEventCreate />} />
            <Route path="/creator/event/edit/:id" element={<CreatorEventEdit />} />
            <Route path="/creator/payments" element={<CreatorPayments />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/events" element={<AdminEvents />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
