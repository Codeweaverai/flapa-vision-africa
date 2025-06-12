import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminLayout from './components/admin/AdminLayout';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import CreatorCourses from './pages/creator/CreatorCourses';
import CreatorEvents from './pages/creator/CreatorEvents';
import CreatorAnalytics from './pages/creator/CreatorAnalytics';
import CreatorStudents from './pages/creator/CreatorStudents';
import CreatorPayments from './pages/creator/CreatorPayments';
import CreatorSettings from './pages/creator/CreatorSettings';
import CreatorLayout from './components/layout/CreatorLayout';
import { QueryClient } from 'react-query';
import { Toaster } from 'sonner';
import CreatorCourseCreate from './pages/creator/CreatorCourseCreate';
import CreatorCourseEdit from './pages/creator/CreatorCourseEdit';
import CreatorCourseContent from './pages/creator/CreatorCourseContent';
import CreatorEventCreate from './pages/creator/CreatorEventCreate';
import CreatorEventEdit from './pages/creator/CreatorEventEdit';
import CreatorEventAgenda from './pages/creator/CreatorEventAgenda';
import CreatorEventSpeakers from './pages/creator/CreatorEventSpeakers';
import CreatorEventRegistrations from './pages/creator/CreatorEventRegistrations';
import AdminCourseEdit from './pages/admin/AdminCourseEdit';
import CourseForm from './pages/admin/CourseForm';
import AdminCourses from './pages/admin/AdminCourses';
import EventForm from './pages/admin/EventForm';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminEventAgenda from './pages/admin/AdminEventAgenda';
import AdminEventSpeakers from './pages/admin/AdminEventSpeakers';
import AdminEventRegistrations from './pages/admin/AdminEventRegistrations';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminProductEdit from './pages/admin/AdminProductEdit';
import AdminCategoryForm from './pages/admin/AdminCategoryForm';
import AdminCategoryEdit from './pages/admin/AdminCategoryEdit';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <QueryClient>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailsPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/about" element={<AboutPage />} />

                  {/* Creator Routes */}
                  <Route path="/creator/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                  <Route path="/creator/courses" element={<ProtectedRoute><CreatorCourses /></ProtectedRoute>} />
                  <Route path="/creator/courses/create" element={<ProtectedRoute><CreatorCourseCreate /></ProtectedRoute>} />
                  <Route path="/creator/courses/:courseId/edit" element={<ProtectedRoute><CreatorCourseEdit /></ProtectedRoute>} />
                  <Route path="/creator/courses/:courseId/content" element={<ProtectedRoute><CreatorCourseContent /></ProtectedRoute>} />
                  <Route path="/creator/events" element={<ProtectedRoute><CreatorEvents /></ProtectedRoute>} />
                  <Route path="/creator/events/create" element={<ProtectedRoute><CreatorEventCreate /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/edit" element={<ProtectedRoute><CreatorEventEdit /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/agenda" element={<ProtectedRoute><CreatorEventAgenda /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/speakers" element={<ProtectedRoute><CreatorEventSpeakers /></ProtectedRoute>} />
                  <Route path="/creator/events/:eventId/registrations" element={<ProtectedRoute><CreatorEventRegistrations /></ProtectedRoute>} />
                  <Route path="/creator/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
                  <Route path="/creator/students" element={<ProtectedRoute><CreatorStudents /></ProtectedRoute>} />
                  <Route path="/creator/payments" element={<ProtectedRoute><CreatorPayments /></ProtectedRoute>} />
                  <Route path="/creator/settings" element={<ProtectedRoute><CreatorSettings /></ProtectedRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                  <Route path="/admin/products/create" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
                  <Route path="/admin/products/:productId/edit" element={<ProtectedRoute><AdminProductEdit /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />

                  <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
                  <Route path="/admin/courses/create" element={<ProtectedRoute><CourseForm /></ProtectedRoute>} />
                  <Route path="/admin/courses/:courseId/edit" element={<ProtectedRoute><CourseForm /></ProtectedRoute>} />

                  <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
                  <Route path="/admin/events/create" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId/edit" element={<ProtectedRoute><AdminEventEdit /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId/agenda" element={<ProtectedRoute><AdminEventAgenda /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId/speakers" element={<ProtectedRoute><AdminEventSpeakers /></ProtectedRoute>} />
                  <Route path="/admin/events/:eventId/registrations" element={<ProtectedRoute><AdminEventRegistrations /></ProtectedRoute>} />

                  <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                  <Route path="/admin/categories/create" element={<ProtectedRoute><AdminCategoryForm /></ProtectedRoute>} />
                  <Route path="/admin/categories/:categoryId/edit" element={<ProtectedRoute><AdminCategoryEdit /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Toaster />
              </div>
            </QueryClient>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
