
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import "./App.css"
import Index from "./pages/Index"
import AboutPage from "./pages/AboutPage"
import ConsultPage from "./pages/ConsultPage"
import SpeakingPage from "./pages/SpeakingPage"
import EventsPage from "./pages/EventsPage"
import LearningPage from "./pages/LearningPage"
import VenturesPage from "./pages/VenturesPage"
import AnimationsPage from "./pages/AnimationsPage"
import AuthPage from "./pages/AuthPage"
import AccountPage from "./pages/AccountPage"
import NotFound from "./pages/NotFound"
import PaymentResultPage from "./pages/PaymentResultPage"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminEvents from "./pages/admin/AdminEvents"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminCourses from "./pages/admin/AdminCourses"
import AdminRegistrations from "./pages/admin/AdminRegistrations"
import AdminConsultations from "./pages/admin/AdminConsultations"
import AdminSpeaking from "./pages/admin/AdminSpeaking"
import AdminSettings from "./pages/admin/AdminSettings"
import AdminLogin from "./pages/admin/AdminLogin"
import CourseContentPage from "./pages/admin/CourseContentPage"
import EventForm from "./pages/admin/EventForm"
import CourseForm from "./pages/admin/CourseForm"
import AdminRoute from "@/components/admin/AdminRoute"
import CourseDetailPage from "./pages/CourseDetailPage"
import CoursePlayerPage from "./pages/CoursePlayerPage"
import QuizzesManagementPage from "./pages/admin/QuizzesManagementPage"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/consult" element={<ConsultPage />} />
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/course/:courseId" element={<CourseDetailPage />} />
          <Route path="/learning/player/:courseId" element={<CoursePlayerPage />} />
          <Route path="/ventures" element={<VenturesPage />} />
          <Route path="/animations" element={<AnimationsPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage isSignUp={true} />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/events/new" element={<AdminRoute><EventForm /></AdminRoute>} />
          <Route path="/admin/events/:eventId" element={<AdminRoute><EventForm /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
          <Route path="/admin/courses/new" element={<AdminRoute><CourseForm /></AdminRoute>} />
          <Route path="/admin/courses/:courseId" element={<AdminRoute><CourseForm /></AdminRoute>} />
          <Route path="/admin/courses/:courseId/content" element={<AdminRoute><CourseContentPage /></AdminRoute>} />
          <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
          <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
          <Route path="/admin/speaking" element={<AdminRoute><AdminSpeaking /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/quizzes" element={<AdminRoute><QuizzesManagementPage /></AdminRoute>} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  )
}

export default App
