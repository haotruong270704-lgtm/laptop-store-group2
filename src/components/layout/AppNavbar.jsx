import { useState } from 'react';
import { Badge, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import SearchSuggest from './SearchSuggest';

/** E1. Thanh điều hướng */
export default function AppNavbar() {
  const { user, isAdmin, logout } = useAuth();
  const { totalQuantity } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // Mobile: chọn menu xong thì thu gọn Navbar
  const collapse = () => setExpanded(false);

  const handleLogout = () => {
    logout();
    collapse();
    showToast('Đã đăng xuất', 'info');
    navigate('/');
  };

  const isUserAdmin = isAdmin ?? (user?.role === 'admin');

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      collapseOnSelect
      expanded={expanded}
      onToggle={setExpanded}
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand as={Link} to={isUserAdmin ? '/admin/laptops' : '/'} onClick={collapse} className="fw-bold">
          💻 LaptopStore
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            {!isUserAdmin && (
              <>
                <Nav.Link as={NavLink} to="/" end eventKey="home">
                  Trang chủ
                </Nav.Link>
                <Nav.Link as={NavLink} to="/laptops" eventKey="laptops">
                  Laptop
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Ô tìm kiếm laptop chỉ hiển thị cho Customer / Khách hàng */}
          {!isUserAdmin && (
            <div className="mx-lg-3 flex-grow-1 search-wrapper">
              <SearchSuggest onNavigate={collapse} />
            </div>
          )}

          <Nav className="align-items-lg-center">
            {/* Ẩn giỏ hàng khi người dùng là Admin */}
            {!isUserAdmin && (
              <Nav.Link as={NavLink} to="/cart" eventKey="cart" aria-label="Giỏ hàng">
                🛒 Giỏ hàng{' '}
                <Badge bg="warning" text="dark" pill>
                  {totalQuantity}
                </Badge>
              </Nav.Link>
            )}

            {user ? (
              <NavDropdown
                title={isUserAdmin ? 'Admin' : 'Customer'}
                id="account-dropdown"
                align="end"
              >
                {isUserAdmin ? (
                  <>
                    <NavDropdown.Item as={Link} to="/profile" onClick={collapse}>
                      Profile
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
                  </>
                ) : (
                  <>
                    <NavDropdown.Item as={Link} to="/orders" onClick={collapse}>
                      Đơn hàng của bạn
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/profile" onClick={collapse}>
                      Profile
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
                  </>
                )}
              </NavDropdown>
            ) : (
              <Nav.Link as={NavLink} to="/login" eventKey="login">
                Đăng nhập
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}