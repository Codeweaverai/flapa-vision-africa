
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/admin/AdminRoute';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AuthPage from '@/pages/AuthPage';
import AccountPage from '@/pages/AccountPage';
import CreatorDashboard from '@/pages/creator/CreatorDashboard';
import CreatorCourses from '@/pages/creator/CreatorCourses';
import CreatorEvents from '@/pages/creator/CreatorEvents';
import CreatorStudents from '@/pages/creator/CreatorStudents';
import CreatorPayments from '@/pages/creator/CreatorPayments';
import CreatorAnalytics from '@/pages/creator/CreatorAnalytics';
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
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import MediaPage from '@/pages/MediaPage';
import MediaPostDetailPage from '@/pages/MediaPostDetailPage';
import AdminMedia from '@/pages/admin/AdminMedia';
import AdminMediaForm from '@/pages/admin/AdminMediaForm';
import AdminNewsletters from '@/pages/admin/AdminNewsletters';
import AdminRegistrations from '@/pages/admin/AdminRegistrations';
import AdminConsultations from '@/pages/admin/AdminConsultations';
import AdminSpeaking from '@/pages/admin/AdminSpeaking';
import AdminCareers from '@/pages/admin/AdminCareers';
import AdminContactSubmissions from '@/pages/admin/AdminContactSubmissions';
import AdminPayouts from '@/pages/admin/AdminPayouts';
import AdminSupportInbox from '@/pages/admin/AdminSupportInbox';
import CreatorPublicProfile from '@/pages/CreatorPublicProfile';
import AdminHelpCenter from '@/pages/admin/AdminHelpCenter';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/media/:id" element={<MediaPostDetailPage />} />
              <Route path="/creators/:creatorId" element={<CreatorPublicProfile />} />

              {/* Protected Routes */}
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

              {/* Creator Routes */}
              <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
              <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
              <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
              <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
              <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
              <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
              <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />

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
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
              <Route path="/admin/media/create" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
              <Route path="/admin/media/:id/edit" element={<AdminRoute><AdminMediaForm /></AdminRoute>} />
              <Route path="/admin/newsletters" element={<AdminRoute><AdminNewsletters /></AdminRoute>} />
              <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
              <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
              <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
              <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
              <Route path="/admin/contact-submissions" element={<AdminRoute><AdminContactSubmissions /></AdminRoute>} />
              <Route path="/admin/payouts" element={<AdminRoute><AdminPayouts /></AdminRoute>} />
              <Route path="/admin/support-inbox" element={<AdminRoute><AdminSupportInbox /></AdminRoute>} />
              <Route path="/admin/help-center" element={<AdminRoute><AdminHelpCenter /></AdminRoute>} />
            </Routes>
            <Toaster />
          </div>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
