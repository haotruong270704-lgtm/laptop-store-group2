import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import axiosClient from '../api/axiosClient';
import { formatPrice } from '../utils/format';
import { useCart } from '../contexts/CartContext';

export default function LaptopDetailPage() {
  const { id } = useParams();
  
  // Gọi hook trực tiếp ở top-level (đã có fallback xử lý bên trong nếu context null)
  const cartContext = useCart();
  const addToCart = cartContext?.addToCart || (() => {});

  const [laptop, setLaptop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLaptopDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        // Dùng Promise.allSettled để xử lý đồng thời 2 API
        const [laptopRes, reviewsRes] = await Promise.allSettled([
          axiosClient.get(`/laptops/${id}`),
          axiosClient.get(`/reviews?laptopId=${id}`)
        ]);

        if (!isMounted) return;

        // Kiểm tra kết quả API Laptop
        if (laptopRes.status === 'fulfilled') {
          setLaptop(laptopRes.value.data);
        } else {
          setError('Không thể tải thông tin chi tiết laptop.');
        }

        // Kiểm tra kết quả API Reviews (Lỗi vẫn cho phép hiển thị trang)
        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value.data);
        } else {
          console.warn('Lỗi khi lấy danh sách đánh giá:', reviewsRes.reason);
          setReviews([]);
        }
      } catch  {
        if (isMounted) {
          setError('Có lỗi xảy ra khi tải dữ liệu!');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchLaptopDetail();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải thông tin sản phẩm...</p>
      </Container>
    );
  }

  if (error || !laptop) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Sản phẩm không tồn tại!'}
        </Alert>
        <Link to="/laptops" className="btn btn-primary">
          Quay lại danh sách sản phẩm
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Nút quay lại */}
      <Link to="/laptops" className="btn btn-outline-secondary btn-sm mb-3">
        &larr; Quay lại danh sách
      </Link>

      {/* Thông tin chính của Laptop */}
      <Row className="mb-5">
        <Col md={5} className="mb-3 mb-md-0">
          <Card className="p-3 text-center shadow-sm">
            <Card.Img
              variant="top"
              src={laptop.image || 'https://via.placeholder.com/400x300?text=Laptop'}
              alt={laptop.name}
              style={{ maxHeight: '350px', objectFit: 'contain' }}
            />
          </Card>
        </Col>

        <Col md={7}>
          <h2 className="fw-bold mb-2">{laptop.name}</h2>
          <div className="mb-3">
            <Badge bg="info" className="me-2">{laptop.brandName || 'Thương hiệu'}</Badge>
            <Badge bg="secondary">{laptop.categoryName || 'Loại'}</Badge>
          </div>

          <h3 className="text-danger fw-bold mb-3">
            {formatPrice ? formatPrice(laptop.price) : `${laptop.price} VNĐ`}
          </h3>

          <p className="text-muted mb-4">
            {laptop.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
          </p>

          <div className="border-top border-bottom py-3 mb-4">
            <Row>
              <Col xs={6} className="mb-2"><strong>RAM:</strong> {laptop.ram || 'N/A'} GB</Col>
              <Col xs={6} className="mb-2"><strong>CPU:</strong> {laptop.cpu || 'N/A'}</Col>
              <Col xs={6} className="mb-2"><strong>Ổ cứng:</strong> {laptop.storage || 'N/A'}</Col>
              <Col xs={6} className="mb-2"><strong>Màn hình:</strong> {laptop.screen || 'N/A'}</Col>
            </Row>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => addToCart(laptop)}
          >
            Thêm vào giỏ hàng
          </Button>
        </Col>
      </Row>

      {/* Đánh giá sản phẩm */}
      <Row>
        <Col xs={12}>
          <h4 className="fw-bold mb-3">Đánh giá từ khách hàng ({reviews.length})</h4>
          {reviews.length === 0 ? (
            <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id} className="mb-2 shadow-sm">
                <Card.Body className="py-2 px-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{rev.userName || 'Người dùng ẩn danh'}</strong>
                    <span className="text-warning font-monospace">★ {rev.rating}/5</span>
                  </div>
                  <p className="mb-0 text-muted mt-1" style={{ fontSize: '0.9rem' }}>
                    {rev.comment}
                  </p>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>
      </Row>
    </Container>
  );
}