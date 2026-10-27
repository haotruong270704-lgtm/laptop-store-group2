import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="text-center py-5">
      <h1 className="display-1 fw-bold text-secondary">404</h1>
      <h2>Trang không tồn tại</h2>
      <p className="text-muted mb-4">Rất tiếc, đường dẫn bạn truy cập không hợp lệ hoặc đã bị di chuyển.</p>
      <Link to="/" className="btn btn-primary">Quay về Trang chủ</Link>
    </div>
  );
};

export default NotFoundPage;