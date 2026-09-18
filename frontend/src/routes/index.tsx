import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('../pages/HomePage'));
const ShopPage = lazy(() => import('../pages/ShopPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/OrderDetailPage'));
const WishlistPage = lazy(() => import('../pages/WishlistPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('../pages/admin/AdminProductForm'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('../pages/admin/AdminOrderDetail'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminInventory = lazy(() => import('../pages/admin/AdminInventory'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminSiteContent = lazy(() => import('../pages/admin/AdminSiteContent'));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-velour-off-white">
    <LoadingSpinner size="lg" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><HomePage /></Suspense> },
      { path: 'shop', element: <Suspense fallback={<Fallback />}><ShopPage /></Suspense> },
      { path: 'shop/:slug', element: <Suspense fallback={<Fallback />}><ProductDetailPage /></Suspense> },
      { path: 'cart', element: <Suspense fallback={<Fallback />}><CartPage /></Suspense> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Fallback />}><CheckoutPage /></Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Fallback />}><OrdersPage /></Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Fallback />}><OrderDetailPage /></Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'wishlist',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Fallback />}><WishlistPage /></Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Fallback />}><ProfilePage /></Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Suspense fallback={<Fallback />}><LoginPage /></Suspense> },
      { path: 'register', element: <Suspense fallback={<Fallback />}><RegisterPage /></Suspense> },
      { path: 'forgot-password', element: <Suspense fallback={<Fallback />}><ForgotPasswordPage /></Suspense> },
      { path: 'reset-password', element: <Suspense fallback={<Fallback />}><ResetPasswordPage /></Suspense> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><AdminDashboard /></Suspense> },
      { path: 'products', element: <Suspense fallback={<Fallback />}><AdminProducts /></Suspense> },
      { path: 'products/new', element: <Suspense fallback={<Fallback />}><AdminProductForm /></Suspense> },
      { path: 'products/:id/edit', element: <Suspense fallback={<Fallback />}><AdminProductForm /></Suspense> },
      { path: 'orders', element: <Suspense fallback={<Fallback />}><AdminOrders /></Suspense> },
      { path: 'orders/:id', element: <Suspense fallback={<Fallback />}><AdminOrderDetail /></Suspense> },
      { path: 'customers', element: <Suspense fallback={<Fallback />}><AdminCustomers /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<Fallback />}><AdminInventory /></Suspense> },
      { path: 'catalogue', element: <Suspense fallback={<Fallback />}><AdminCategories /></Suspense> },
      { path: 'content', element: <Suspense fallback={<Fallback />}><AdminSiteContent /></Suspense> },
      { path: 'reviews', element: <Suspense fallback={<Fallback />}><AdminReviews /></Suspense> },
    ],
  },
  {
    path: '*',
    element: <Suspense fallback={<Fallback />}><NotFoundPage /></Suspense>,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
