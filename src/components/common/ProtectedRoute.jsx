import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  // 1. Kiểm tra chưa đăng nhập -> Chuyển hướng sang trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra nếu có yêu cầu Role và Role người dùng không hợp lệ
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Cho phép truy cập vào các Route con
  return <Outlet />;
};

export default ProtectedRoute;