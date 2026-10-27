import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import LaptopListPage from '../pages/LaptopListPage';
import LaptopDetailPage from '../pages/LaptopDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrderListPage from '../pages/OrderListPage';
import OrderDetailPage from '../pages/OrderDetailPage';
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
      </Route>

      {/* Wildcard Route 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}