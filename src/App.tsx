
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AboutPage from './pages/AboutPage';
import AnimationsPage from './pages/AnimationsPage';
import ConsultPage from './pages/ConsultPage';
import SpeakingPage from './pages/SpeakingPage';
import EventsPage from './pages/EventsPage';
import VenturesPage from './pages/VenturesPage';
import LearningPage from './pages/LearningPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import AccountPage from './pages/AccountPage';
import AuthPage from './pages/AuthPage';
import PaymentResultPage from './pages/PaymentResultPage';
import NotFound from './pages/NotFound';
import AdminRoute from './components/admin/AdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import EventForm from './pages/admin/EventForm';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCourses from './pages/admin/AdminCourses';
import AdminSpeaking from './pages/admin/AdminSpeaking';
import AdminConsultations from './pages/admin/AdminConsultations';
import CourseForm from './pages/admin/CourseForm';
import CourseEditPage from './pages/admin/CourseEditPage';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster as ToastProvider } from './components/ui/toaster';

function App() {
  // Place BrowserRouter outside of AuthProvider to fix the router context error
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/animations" element={<AnimationsPage />} />
          <Route path="/consult" element={<ConsultPage />} />
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/ventures" element={<VenturesPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/course/:courseId" element={<CourseDetailPage />} />
          <Route path="/learning/player/:courseId" element={<CoursePlayerPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <AdminRoute>
                <AdminEvents />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <AdminRoute>
                <EventForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events/edit/:eventId"
            element={
              <AdminRoute>
                <EventForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/registrations"
            element={
              <AdminRoute>
                <AdminRegistrations />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <AdminRoute>
                <AdminCourses />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses/create"
            element={
              <AdminRoute>
                <CourseForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses/edit/:courseId"
            element={
              <AdminRoute>
                <CourseEditPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/speaking"
            element={
              <AdminRoute>
                <AdminSpeaking />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/consultations"
            element={
              <AdminRoute>
                <AdminConsultations />
              </AdminRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <ToastProvider />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
