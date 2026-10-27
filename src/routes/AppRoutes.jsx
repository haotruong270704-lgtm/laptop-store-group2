import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

import laptopApi from '../api/laptopApi';
import useAxios from '../hooks/useAxios';
import LaptopGrid from '../components/laptop/LaptopGrid';
import dbData from '../../db.json';

const HomePage = () => {
  const { data, loading } = useAxios((signal) => laptopApi.getAll({ _limit: 8 }, signal), []);
  const laptops = data?.items?.length ? data.items : dbData.laptops.slice(0, 8);

  return (
    <div className="py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">💻 Sản phẩm nổi bật (#15 LaptopGrid)</h3>
          <p className="text-muted mb-0">Hiển thị thẻ sản phẩm với giá bán, cấu hình, rating sao và trạng thái kho</p>
        </div>
      </div>
      <LaptopGrid laptops={laptops} loading={loading} />
    </div>
  );
};
const LaptopsPage = () => <h2>Danh sách Laptop</h2>;
const LoginPage = () => <h2>Trang Đăng Nhập</h2>;
const ProfilePage = () => <h2>Trang Thông Tin Cá Nhân (Customer)</h2>;
const AdminDashboard = () => <h2>Dashboard Quản trị (Admin)</h2>;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="laptops" element={<LaptopsPage />} />
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