import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="d-flex min-vh-100">
      <aside className="bg-dark text-white p-3" style={{ width: '250px' }}>
        <h5 className="mb-4">Admin Dashboard</h5>
        <ul className="nav nav-pills flex-column">
          <li className="nav-item mb-2">
            <Link to="/admin" className="nav-link text-white">Tổng quan</Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/admin/laptops" className="nav-link text-white">Quản lý Laptop</Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/admin/orders" className="nav-link text-white">Quản lý Đơn hàng</Link>
          </li>
          <li className="nav-item mt-4">
            <Link to="/" className="btn btn-danger w-100">Về trang bán hàng</Link>
          </li>
        </ul>
      </aside>

      <main className="flex-grow-1 p-4 bg-light">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;