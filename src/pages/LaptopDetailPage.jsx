import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap';
import axiosClient from '../api/axiosClient';
import { formatPrice } from '../utils/format';

export default function LaptopDetailPage() {
  const { id } = useParams();

  const [laptop, setLaptop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Form Đánh giá (Issue #21)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLaptopDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const [laptopRes, reviewsRes] = await Promise.allSettled([
          axiosClient.get(`/laptops/${id}`),
          axiosClient.get(`/reviews?laptopId=${id}`)
        ]);

        if (!isMounted) return;

        if (laptopRes.status === 'fulfilled') {
          setLaptop(laptopRes.value.data);
        } else {
          setError('Không thể tải thông tin chi tiết laptop.');
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value.data);
        } else {
          setReviews([]);
        }
      } catch {
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

  // Xử lý gửi đánh giá mới (Issue #21)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const newReview = {
        laptopId: id,
        userName: 'Khách hàng',
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      const res = await axiosClient.post('/reviews', newReview);
      setReviews((prev) => [res.data, ...prev]);
      setComment('');
      setRating(5);
      setSubmitMessage({ type: 'success', text: 'Gửi đánh giá thành công!' });
    } catch {
      setSubmitMessage({ type: 'danger', text: 'Không thể gửi đánh giá, vui lòng thử lại!' });
    } finally {
      setSubmitting(false);
    }
  };

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
        <Alert variant="danger">{error || 'Sản phẩm không tồn tại!'}</Alert>
        <Link to="/laptops" className="btn btn-primary">
          Quay lại danh sách sản phẩm
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/laptops" className="btn btn-outline-secondary btn-sm mb-3">
        &larr; Quay lại danh sách
      </Link>

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

          <p className="text-muted mb-4">{laptop.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>
        </Col>
      </Row>

      {/* Danh sách đánh giá & Form đánh giá (Issue #21) */}
      <Row className="mt-4">
        <Col md={7} className="mb-4">
          <h4 className="fw-bold mb-3">Đánh giá từ khách hàng ({reviews.length})</h4>
          {reviews.length === 0 ? (
            <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id || Math.random()} className="mb-2 shadow-sm">
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

        {/* Form viết đánh giá */}
        <Col md={5}>
          <Card className="p-3 shadow-sm border-0 bg-light">
            <h5 className="fw-bold mb-3">Viết đánh giá của bạn</h5>
            {submitMessage && (
              <Alert variant={submitMessage.type} dismissible onClose={() => setSubmitMessage(null)}>
                {submitMessage.text}
              </Alert>
            )}
            <Form onSubmit={handleReviewSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Đánh giá (Sao)</Form.Label>
                <Form.Select value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="5">5 ★ - Tuyệt vời</option>
                  <option value="4">4 ★ - Tốt</option>
                  <option value="3">3 ★ - Bình thường</option>
                  <option value="2">2 ★ - Kém</option>
                  <option value="1">1 ★ - Rất tệ</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Nội dung nhận xét</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : 'Gửi đánh giá'}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}