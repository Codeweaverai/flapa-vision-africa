
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import PricingPage from './pages/PricingPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CourseLearningPage from './pages/learning/CourseLearningPage';
import CourseResultsPage from './pages/CourseResultsPage';
import InboxPage from './pages/InboxPage';
import MessagesPage from './pages/MessagesPage';
import ExploreCoursesPage from './pages/ExploreCoursesPage';
import CourseEnrollmentPage from './pages/CourseEnrollmentPage';
import LessonPage from './pages/LessonPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <div className="App">
                <Toaster />
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/course/:courseId" element={<CourseDetailPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/creator/profile/:creatorId" element={<CreatorPublicProfile />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/explore-courses" element={<ExploreCoursesPage />} />
                    <Route path="/course/:courseId/enroll" element={<CourseEnrollmentPage />} />
                    <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPage />} />
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/messages/:userId" element={<MessagesPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                    
                    {/* Course Learning and Results Routes */}
                    <Route path="/course/:courseId/learn" element={<CourseLearningPage />} />
                    <Route path="/course/:id/learn" element={<CourseLearningPage />} />
                    <Route path="/course/:courseId/results" element={<CourseResultsPage />} />
                    <Route path="/course/:id/results" element={<CourseResultsPage />} />
                    
                  </Routes>
                </Layout>
              </div>
            </Router>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
