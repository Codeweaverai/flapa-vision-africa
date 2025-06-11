
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseLearningPage from './pages/learning/CourseLearningPage';
import LearningPage from './pages/LearningPage';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import CourseResultsPage from './pages/CourseResultsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import { Toaster } from 'sonner';
import VerifyPage from './pages/VerifyPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/auth" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/learning/course-detail/:id" element={<CourseDetailPage />} />
                <Route path="/learning/course/:id" element={<CourseLearningPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/explore/courses" element={<ExploreCoursesPage />} />
                <Route path="/course-results" element={<CourseResultsPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
            </QueryClientProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
