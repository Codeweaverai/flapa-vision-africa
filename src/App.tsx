import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CoursePlayerPage from './pages/CoursePlayerPage';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import TicketVerification from './pages/TicketVerification';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminEvents from './pages/admin/AdminEvents';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import AdminSettings from './pages/admin/AdminSettings';
import ProtectedRoute from './components/ProtectedRoute';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorCourseCreate from './pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from './pages/creator/CreatorCourseEdit';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import CreatorEventTickets from './pages/creator/CreatorEventTickets';
import CreatorEventSpeakers from './pages/creator/CreatorEventSpeakers';
import CreatorEventAgenda from './pages/creator/CreatorEventAgenda';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorStudents from './pages/creator/CreatorStudents';
import CreatorPayments from './pages/creator/CreatorPayments';
import CreatorPromoCodes from './pages/creator/CreatorPromoCodes';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorAttendeeManagement from './pages/creator/CreatorAttendeeManagement';

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <CurrencyProvider>
        <CartProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/course-player/:courseId" element={<ProtectedRoute><CoursePlayerPage /></ProtectedRoute>} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/ticket-verification" element={<TicketVerification />} />

                {/* User Routes */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
                <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                <Route path="/admin/promo-codes" element={<ProtectedRoute><AdminPromoCodes /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                
                {/* Creator Routes */}
                <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                <Route path="/creator/attendee-management" element={<ProtectedRoute><CreatorAttendeeManagement /></ProtectedRoute>} />
                <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                <Route path="/creator/courses/:id/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                <Route path="/creator/courses/:id/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                <Route path="/creator/events/:id/edit" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                <Route path="/creator/events/:id/registrations" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                <Route path="/creator/events/:id/tickets" element={<ProtectedRoute><CreatorEventTickets /></ProtectedRoute>} />
                <Route path="/creator/events/:id/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                <Route path="/creator/events/:id/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                <Route path="/creator/promo-codes" element={<ProtectedRoute><CreatorPromoCodes /></ProtectedRoute>} />
                <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />
              </Routes>
            </Router>
          </AuthProvider>
        </CartProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;
