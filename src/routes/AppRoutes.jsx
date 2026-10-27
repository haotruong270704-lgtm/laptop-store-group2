import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import LaptopListPage from '../pages/LaptopListPage';
import LaptopDetailPage from '../pages/LaptopDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrderListPage from '../pages/OrderListPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import AdminLaptopPage from '../pages/AdminLaptopPage';
import AdminLaptopFormPage from '../pages/AdminLaptopFormPage';
import AdminOrderPage from '../pages/AdminOrderPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="laptops" element={<LaptopListPage />} />
        <Route path="laptops/:id" element={<LaptopDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrderListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />

        {/* User Profile */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Auth Route */}
        <Route path="login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="admin/laptops" element={<AdminLaptopPage />} />
        <Route path="admin/laptops/create" element={<AdminLaptopFormPage />} />
        <Route path="admin/laptops/edit/:id" element={<AdminLaptopFormPage />} />
        <Route path="admin/orders" element={<AdminOrderPage />} />
      </Route>

      {/* Wildcard Route 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}