import { Container, Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import usePageTitle from '../hooks/usePageTitle';

export default function ProfilePage() {
  usePageTitle('Thông tin cá nhân');
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h4>Vui lòng đăng nhập để xem thông tin cá nhân</h4>
        <Button as={Link} to="/login" className="mt-3">
          Đăng nhập
        </Button>
      </Container>
    );
  }

  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất', 'info');
    navigate('/');
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold">Thông tin cá nhân</h5>
              <Badge bg={isAdmin ? 'danger' : 'primary'} className="fs-6 text-uppercase">
                {user.role}
              </Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fs-2 fw-bold"
                  style={{ width: 64, height: 64 }}
                >
                  {isAdmin ? '👑' : '👤'}
                </div>
                <div>
                  <h4 className="fw-bold mb-1">
                    {user.fullName || (isAdmin ? 'Quản trị viên' : 'Khách hàng')}
                  </h4>
                  <p className="text-muted mb-0">{user.email}</p>
                </div>
              </div>

              <div className="border-top pt-3">
                <Row className="mb-3">
                  <Col sm={4} className="text-secondary fw-semibold">
                    Vai trò:
                  </Col>
                  <Col sm={8}>
                    <Badge bg={isAdmin ? 'danger' : 'primary'} className="text-uppercase">
                      {isAdmin ? 'Quản trị viên (Admin)' : 'Khách hàng (Customer)'}
                    </Badge>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-secondary fw-semibold">
                    Email:
                  </Col>
                  <Col sm={8}>{user.email}</Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-secondary fw-semibold">
                    Họ tên:
                  </Col>
                  <Col sm={8}>{user.fullName || 'Chưa cập nhật'}</Col>
                </Row>
              </div>

              <div className="d-flex flex-wrap gap-2 justify-content-end mt-4 pt-3 border-top">
                {!isAdmin && (
                  <Button as={Link} to="/orders" variant="outline-primary">
                    📦 Đơn hàng của bạn
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button as={Link} to="/admin/laptops" variant="outline-primary">
                      💻 Quản lý Laptop
                    </Button>
                    <Button as={Link} to="/admin/orders" variant="outline-success">
                      📦 Quản lý Đơn hàng
                    </Button>
                  </>
                )}
                <Button variant="danger" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
