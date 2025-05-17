
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import VenturesPage from "./pages/VenturesPage";
import SpeakingPage from "./pages/SpeakingPage";
import AnimationsPage from "./pages/AnimationsPage";
import LearningPage from "./pages/LearningPage";
import EventsPage from "./pages/EventsPage";
import ConsultPage from "./pages/ConsultPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSpeaking from "./pages/admin/AdminSpeaking";
import AdminConsultations from "./pages/admin/AdminConsultations";
import AdminSettings from "./pages/admin/AdminSettings";
import EventForm from "./pages/admin/EventForm";
import { AuthProvider } from "./contexts/AuthContext";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminRoute from "./components/admin/AdminRoute";
import CourseDetailPage from "./pages/CourseDetailPage";
import AdminCourses from "./pages/admin/AdminCourses";
import CourseForm from "./pages/admin/CourseForm";
import CoursePlayerPage from "./pages/CoursePlayerPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/ventures" element={<VenturesPage />} />
            <Route path="/speaking" element={<SpeakingPage />} />
            <Route path="/ai-animations" element={<AnimationsPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/learning/course/:courseId" element={<CourseDetailPage />} />
            <Route path="/learning/player/:courseId" element={<CoursePlayerPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/consult" element={<ConsultPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/payment-result" element={<PaymentResultPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
            <Route path="/admin/events/create" element={<AdminRoute><EventForm /></AdminRoute>} />
            <Route path="/admin/events/edit/:id" element={<AdminRoute><EventForm /></AdminRoute>} />
            <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
            <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
            <Route path="/admin/courses/create" element={<AdminRoute><CourseForm /></AdminRoute>} />
            <Route path="/admin/courses/edit/:id" element={<AdminRoute><CourseForm /></AdminRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
