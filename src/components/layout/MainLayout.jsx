import { Outlet, Link } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="bg-dark text-white p-3">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className="h4 text-white text-decoration-none">LaptopStore</Link>
          <nav>
            <Link to="/" className="text-white me-3 text-decoration-none">Trang chủ</Link>
            <Link to="/laptops" className="text-white me-3 text-decoration-none">Sản phẩm</Link>
            <Link to="/cart" className="text-white me-3 text-decoration-none">Giỏ hàng</Link>
            <Link to="/login" className="btn btn-outline-light btn-sm">Đăng nhập</Link>
          </nav>
        </div>
      </header>

      <main className="container my-4 flex-grow-1">
        <Outlet />
      </main>

      <footer className="bg-light text-center py-3 mt-auto border-top">
        <p className="mb-0 text-muted">&copy; 2026 LaptopStore Group 2. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;