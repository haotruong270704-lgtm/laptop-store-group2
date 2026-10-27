import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Gọi json-server kiểm tra tài khoản
      const res = await axiosClient.get(`/users?email=${email}&password=${password}`);

      if (res.data && res.data.length > 0) {
        const foundUser = res.data[0];

        // 2. Truyền object user đầy đủ (id, email, fullName, role) vào hàm login của AuthContext
        login(foundUser);

        // 3. Điều hướng theo Role
        if (foundUser.role === 'admin') {
          navigate('/admin/laptops', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError('Email hoặc mật khẩu không chính xác!');
      }
    } catch {
      // Fallback khi json-server offline hoặc gặp lỗi mạng
      const fallbackUsers = [
        {
          id: 1,
          email: 'admin@laptopstore.vn',
          password: '123456',
          fullName: 'Quản trị viên',
          role: 'admin',
        },
        {
          id: 2,
          email: 'khach@laptopstore.vn',
          password: '123456',
          fullName: 'Nguyễn Văn An',
          role: 'customer',
        },
      ];

      const foundUser = fallbackUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (foundUser) {
        login(foundUser);
        if (foundUser.role === 'admin') {
          navigate('/admin/laptops', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError('Email hoặc mật khẩu không chính xác!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setEmail('admin@laptopstore.vn');
      setPassword('123456');
    } else {
      setEmail('khach@laptopstore.vn');
      setPassword('123456');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '75vh' }}>
      <Card className="p-4 shadow-sm border-0 rounded-3" style={{ width: '100%', maxWidth: '420px' }}>
        <h3 className="fw-bold text-center mb-1">Đăng Nhập</h3>
        <p className="text-center text-muted small mb-4">
          Nhập thông tin tài khoản để tiếp tục
        </p>

        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-secondary">Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="nhap@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold text-secondary">Mật khẩu</Form.Label>
            <Form.Control
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button type="submit" variant="primary" className="w-100 fw-bold py-2 mb-3" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
        </Form>

        <div className="border-top pt-3 text-center">
          <small className="text-muted d-block mb-2">Đăng nhập nhanh (Test Data):</small>
          <div className="d-flex justify-content-center gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleQuickLogin('admin')}
            >
              🔑 <Badge bg="danger">Admin</Badge>
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleQuickLogin('customer')}
            >
              👤 <Badge bg="primary">Customer</Badge>
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}