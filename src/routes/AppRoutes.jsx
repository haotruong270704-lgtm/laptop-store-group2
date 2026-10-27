import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import NotFoundPage from '../pages/NotFoundPage';

// Placeholder các trang tạm thời
const HomePage = () => <h2>Trang chủ (Home)</h2>;
const LaptopsPage = () => <h2>Danh sách Laptop</h2>;
const AdminDashboard = () => <h2>Dashboard Quản trị</h2>;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Client Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="laptops" element={<LaptopsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;