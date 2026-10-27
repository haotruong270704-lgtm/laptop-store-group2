import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

import HomePage from '../pages/HomePage';
import LaptopListPage from '../pages/LaptopListPage';
const LoginPage = () => <h2>Trang Đăng Nhập</h2>;
const ProfilePage = () => <h2>Trang Thông Tin Cá Nhân (Customer)</h2>;
const AdminDashboard = () => <h2>Dashboard Quản trị (Admin)</h2>;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="laptops" element={<LaptopListPage />} />
        <Route path="login" element={<LoginPage />} />

        {/* Routes yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin Routes - Yêu cầu role Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;