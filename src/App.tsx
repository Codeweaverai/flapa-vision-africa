
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import EventsPage from '@/pages/EventsPage';
import AccountPage from '@/pages/AccountPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ContactPage from '@/pages/ContactPage';
import AboutPage from '@/pages/AboutPage';
import NotFoundPage from '@/pages/NotFoundPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import VerifyCertificatePage from '@/pages/VerifyCertificatePage';
import TicketVerificationPage from '@/pages/TicketVerificationPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailPage />} />
              <Route path="/account/*" element={<AccountPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
              <Route path="/ticket-verification" element={<TicketVerificationPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
