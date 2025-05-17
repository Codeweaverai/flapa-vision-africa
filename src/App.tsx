
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Layout from './components/layout/Layout';
import Index from './pages/Index';
import AboutPage from './pages/AboutPage';
import SpeakingPage from './pages/SpeakingPage';
import VenturesPage from './pages/VenturesPage';
import LearningPage from './pages/LearningPage';
import AnimationsPage from './pages/AnimationsPage';
import ConsultPage from './pages/ConsultPage';
import EventsPage from './pages/EventsPage';
import AccountPage from './pages/AccountPage';
import AuthPage from './pages/AuthPage';
import AdminAuthPage from './pages/AdminAuthPage';
import NotFound from './pages/NotFound';
import PaymentResultPage from './pages/PaymentResultPage';
import { AuthProvider } from './contexts/AuthContext';

// Import the admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import EventForm from "./pages/admin/EventForm";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster position="bottom-right" richColors />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="speaking" element={<SpeakingPage />} />
              <Route path="ventures" element={<VenturesPage />} />
              <Route path="learning" element={<LearningPage />} />
              <Route path="animations" element={<AnimationsPage />} />
              <Route path="consult" element={<ConsultPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="payment-result" element={<PaymentResultPage />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/events/create" element={<EventForm />} />
            <Route path="/admin/events/edit/:id" element={<EventForm />} />

            {/* Auth Routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin-login" element={<AdminAuthPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
