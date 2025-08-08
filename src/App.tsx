import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/admin/AdminRoute";
import Layout from "@/components/layout/Layout";

// Pages
import HomePage from "@/pages/HomePage";
import PricingPage from "@/pages/PricingPage";
import ContactPage from "@/pages/ContactPage";
import HelpCenterPage from "@/pages/HelpCenterPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SuccessPage from "@/pages/SuccessPage";
import CancelPage from "@/pages/CancelPage";
import ExploreCoursesPage from "@/pages/ExploreCoursesPage";
import CourseDetailsPage from "@/pages/CourseDetailsPage";
import CourseContentPage from "@/pages/CourseContentPage";
import ExploreEventsPage from "@/pages/ExploreEventsPage";
import EventDetailsPage from "@/pages/EventDetailsPage";
import RegistrationSuccessPage from "@/pages/RegistrationSuccessPage";
import RegistrationCancelPage from "@/pages/RegistrationCancelPage";
import ConsultationsPage from "@/pages/ConsultationsPage";
import SpeakingPage from "@/pages/SpeakingPage";
import CareersPage from "@/pages/CareersPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import EmailConfirmationPage from "@/pages/EmailConfirmationPage";
import EmailConfirmationSuccessPage from "@/pages/EmailConfirmationSuccessPage";
import EmailConfirmationCancelPage from "@/pages/EmailConfirmationCancelPage";
import CreateCoursePage from "@/pages/CreateCoursePage";
import CreateEventPage from "@/pages/CreateEventPage";
import MediaPage from "@/pages/MediaPage";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminCourseCreate from "@/pages/admin/AdminCourseCreate";
import AdminCourseEdit from "@/pages/admin/AdminCourseEdit";
import AdminCourseContent from "@/pages/admin/AdminCourseContent";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminEventCreate from "@/pages/admin/AdminEventCreate";
import AdminEventEdit from "@/pages/admin/AdminEventEdit";
import AdminEventRegistrations from "@/pages/admin/AdminEventRegistrations";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminPayouts from "@/pages/admin/AdminPayouts";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminMediaForm from "@/pages/admin/AdminMediaForm";
import AdminConsultations from "@/pages/admin/AdminConsultations";
import AdminSpeaking from "@/pages/admin/AdminSpeaking";
import AdminRegistrations from "@/pages/admin/AdminRegistrations";
import AdminContactSubmissions from "@/pages/admin/AdminContactSubmissions";
import AdminHelpCenter from "@/pages/admin/AdminHelpCenter";
import AdminSupportInbox from "@/pages/admin/AdminSupportInbox";
import AdminCareers from "@/pages/admin/AdminCareers";
import AdminSettings from "@/pages/admin/AdminSettings";

// Admin Newsletter imports
import AdminNewsletters from "@/pages/admin/AdminNewsletters";
import AdminNewsletterTemplates from "@/pages/admin/AdminNewsletterTemplates";
import AdminEnhancedNewsletters from "@/pages/admin/AdminEnhancedNewsletters";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <CurrencyProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Layout><HomePage /></Layout>} />
                  <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
                  <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
                  <Route path="/help-center" element={<Layout><HelpCenterPage /></Layout>} />
                  <Route path="/terms" element={<Layout><TermsOfServicePage /></Layout>} />
                  <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
                  <Route path="/login" element={<Layout><LoginPage /></Layout>} />
                  <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
                  <Route path="/forgot-password" element={<Layout><ForgotPasswordPage /></Layout>} />
                  <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />
                  <Route path="/email-confirmation" element={<Layout><EmailConfirmationPage /></Layout>} />
                  <Route path="/email-confirmation/success" element={<Layout><EmailConfirmationSuccessPage /></Layout>} />
                  <Route path="/email-confirmation/cancel" element={<Layout><EmailConfirmationCancelPage /></Layout>} />

                  {/* Protected Routes */}
                  <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Layout><CheckoutPage /></Layout></ProtectedRoute>} />
                  <Route path="/success" element={<ProtectedRoute><Layout><SuccessPage /></Layout></ProtectedRoute>} />
                  <Route path="/cancel" element={<ProtectedRoute><Layout><CancelPage /></Layout></ProtectedRoute>} />
                  <Route path="/courses" element={<Layout><ExploreCoursesPage /></Layout>} />
                  <Route path="/courses/:id" element={<Layout><CourseDetailsPage /></Layout>} />
                  <Route path="/courses/:id/content" element={<ProtectedRoute><Layout><CourseContentPage /></Layout></ProtectedRoute>} />
                  <Route path="/events" element={<Layout><ExploreEventsPage /></Layout>} />
                  <Route path="/events/:id" element={<Layout><EventDetailsPage /></Layout>} />
                  <Route path="/events/:id/success" element={<ProtectedRoute><Layout><RegistrationSuccessPage /></Layout></ProtectedRoute>} />
                  <Route path="/events/:id/cancel" element={<ProtectedRoute><Layout><RegistrationCancelPage /></Layout></ProtectedRoute>} />
                  <Route path="/consultations" element={<Layout><ConsultationsPage /></Layout>} />
                  <Route path="/speaking" element={<Layout><SpeakingPage /></Layout>} />
                  <Route path="/create-course" element={<ProtectedRoute><Layout><CreateCoursePage /></Layout></ProtectedRoute>} />
                  <Route path="/create-event" element={<ProtectedRoute><Layout><CreateEventPage /></Layout></ProtectedRoute>} />
                  <Route path="/media" element={<ProtectedRoute><Layout><MediaPage /></Layout></ProtectedRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/*" element={
                    <AdminRoute>
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="courses" element={<AdminCourses />} />
                        <Route path="courses/create" element={<AdminCourseCreate />} />
                        <Route path="courses/:id/edit" element={<AdminCourseEdit />} />
                        <Route path="courses/:id/content" element={<AdminCourseContent />} />
                        <Route path="events" element={<AdminEvents />} />
                        <Route path="events/create" element={<AdminEventCreate />} />
                        <Route path="events/:id/edit" element={<AdminEventEdit />} />
                        <Route path="events/:id/registrations" element={<AdminEventRegistrations />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="payouts" element={<AdminPayouts />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="media" element={<AdminMedia />} />
                        <Route path="media/create" element={<AdminMediaForm />} />
                        <Route path="consultations" element={<AdminConsultations />} />
                        <Route path="speaking" element={<AdminSpeaking />} />
                        <Route path="registrations" element={<AdminRegistrations />} />
                        <Route path="contact" element={<AdminContactSubmissions />} />
                        <Route path="help-center" element={<AdminHelpCenter />} />
                        <Route path="support" element={<AdminSupportInbox />} />
                        <Route path="careers" element={<AdminCareers />} />
                        <Route path="newsletters" element={<AdminNewsletters />} />
                        <Route path="newsletters/templates" element={<AdminNewsletterTemplates />} />
                        <Route path="newsletters/create" element={<AdminEnhancedNewsletters />} />
                        <Route path="settings" element={<AdminSettings />} />
                      </Routes>
                    </AdminRoute>
                  } />

                  {/* Catch-all route for 404 Not Found */}
                  <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                </Routes>
              </CurrencyProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
