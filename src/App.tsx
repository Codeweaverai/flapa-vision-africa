import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import About from './pages/About';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import UserProfile from './pages/user/UserProfile';
import UserDashboard from './pages/user/UserDashboard';
import UserCourses from './pages/user/UserCourses';
import UserEvents from './pages/user/UserEvents';
import UserOrders from './pages/user/UserOrders';
import UserReviews from './pages/user/UserReviews';
import UserSettings from './pages/user/UserSettings';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorCourseCreate from './pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from './pages/creator/CreatorCourseEdit';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorSettings from './pages/creator/CreatorSettings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EmailVerification from './pages/auth/EmailVerification';
import Logout from './pages/auth/Logout';
import AuthRoute from './components/auth/AuthRoute';
import CreatorRoute from './components/auth/CreatorRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseCreate from './pages/admin/AdminCourseCreate';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventCreate from './pages/admin/AdminEventCreate';
import AdminEventEdit from './pages/admin/AdminEventEdit';
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
import AdminCareers from './pages/admin/AdminCareers';
import AdminSupportInbox from './pages/admin/AdminSupportInbox';
import ShoppingCart from './pages/ShoppingCart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import { Toaster } from 'sonner';
import { QueryClient } from 'react-query';
import CreatorLayout from './components/creator/CreatorLayout';
import AdminLayout from './components/admin/AdminLayout';
import AdminSidebar from './components/admin/AdminSidebar';
import { ReactQueryDevtools } from 'react-query/devtools';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import CreatorConsultations from './pages/creator/CreatorConsultations';
import CreatorSpeaking from './pages/creator/CreatorSpeaking';
import CreatorCareers from './pages/creator/CreatorCareers';
import CreatorSupportInbox from './pages/creator/CreatorSupportInbox';
import AdminPayouts from '@/pages/admin/AdminPayouts';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <QueryClient>
              <Toaster />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CourseDetails />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/email-verification" element={<EmailVerification />} />
                <Route path="/logout" element={<Logout />} />

                {/* User Routes */}
                <Route path="/user" element={<AuthRoute><UserDashboard /></AuthRoute>} />
                <Route path="/user/dashboard" element={<AuthRoute><UserDashboard /></AuthRoute>} />
                <Route path="/user/profile" element={<AuthRoute><UserProfile /></AuthRoute>} />
                <Route path="/user/courses" element={<AuthRoute><UserCourses /></AuthRoute>} />
                <Route path="/user/events" element={<AuthRoute><UserEvents /></AuthRoute>} />
                <Route path="/user/orders" element={<AuthRoute><UserOrders /></AuthRoute>} />
                <Route path="/user/reviews" element={<AuthRoute><UserReviews /></AuthRoute>} />
                <Route path="/user/settings" element={<AuthRoute><UserSettings /></AuthRoute>} />

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
                <Route path="/creator/events/:id/registrations" element={<CreatorRoute><CreatorEventRegistrations /></CreatorRoute>} />
                <Route path="/creator/analytics" element={<CreatorRoute><CreatorAnalytics /></CreatorRoute>} />
                <Route path="/creator/settings" element={<CreatorRoute><CreatorSettings /></CreatorRoute>} />
                <Route path="/creator/consultations" element={<CreatorRoute><CreatorConsultations /></CreatorRoute>} />
                <Route path="/creator/speaking" element={<CreatorRoute><CreatorSpeaking /></CreatorRoute>} />
                <Route path="/creator/careers" element={<CreatorRoute><CreatorCareers /></CreatorRoute>} />
                <Route path="/creator/support-inbox" element={<CreatorRoute><CreatorSupportInbox /></CreatorRoute>} />

                {/* Cart and Checkout */}
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />

                {/* Admin Routes */}
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
                <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
                <Route path="/admin/support-inbox" element={<AdminRoute><AdminSupportInbox /></AdminRoute>} />
                <Route path="/admin/payouts" element={<AdminRoute><AdminPayouts /></AdminRoute>} />

                {/* Catch-all route for 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </QueryClient>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
