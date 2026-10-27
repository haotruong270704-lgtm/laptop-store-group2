import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Placeholder các trang tạm thời
import { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';

const HomePage = () => {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    showToast('Đây là thông báo success!', 'success');
    showToast('Đây là thông báo danger!', 'danger');
    showToast('Đây là thông báo warning!', 'warning');
    showToast('Đây là thông báo info!', 'info');
  }, [showToast]);

  return (
    <div className="py-4">
      <h3 className="mb-4 text-center">Kiểm thử ToastContext &amp; ConfirmModal (#12)</h3>
      <div className="mb-4 text-center">
        <h5 className="mb-3">1. Kiểm tra 4 loại Toast thông báo:</h5>
        {['success', 'danger', 'warning', 'info'].map((v) => (
          <Button
            key={v}
            variant={v}
            className="me-2 text-capitalize text-white"
            onClick={() => showToast(`Đây là thông báo ${v}!`, v)}
          >
            Toast {v}
          </Button>
        ))}
      </div>
      <div className="text-center">
        <h5 className="mb-3">2. Kiểm tra Modal xác nhận (ConfirmModal):</h5>
        <Button variant="danger" onClick={() => setShowModal(true)}>
          Mở ConfirmModal xác nhận
        </Button>
      </div>
      <ConfirmModal
        show={showModal}
        title="Xác nhận thao tác"
        message="Bạn có chắc chắn muốn thực hiện thao tác xóa dữ liệu này không?"
        onConfirm={() => {
          showToast('Đã xác nhận thao tác thành công!', 'success');
          setShowModal(false);
        }}
        onCancel={() => setShowModal(false)}
      />
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