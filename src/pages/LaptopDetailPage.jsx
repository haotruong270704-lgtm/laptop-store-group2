import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap';
import axiosClient from '../api/axiosClient';
import { formatPrice } from '../utils/format';
import { useCart } from '../contexts/CartContext';

export default function LaptopDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [laptop, setLaptop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State Form Đánh Giá
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const newReview = {
        laptopId: id,
        userName: userName.trim() || 'Khách hàng',
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: new Date().toLocaleDateString('vi-VN')
      };

      const res = await axiosClient.post('/reviews', newReview);
      setReviews((prev) => [res.data, ...prev]);
      setComment('');
      setUserName('');
      setRating(5);
      setSubmitMessage({ type: 'success', text: 'Cảm ơn bạn đã đóng góp đánh giá!' });
    } catch {
      setSubmitMessage({ type: 'danger', text: 'Gửi đánh giá thất bại, vui lòng thử lại!' });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper render sao đánh giá chuyên nghiệp
  const renderStars = (starCount) => {
    return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
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

      {/* Thông tin sản phẩm */}
      <Row className="mb-5">
        <Col md={5} className="mb-3 mb-md-0">
          <Card className="p-3 text-center shadow-sm border-0 bg-white rounded-3">
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
            <Badge bg="info" className="me-2 px-2 py-1">{laptop.brandName || 'Thương hiệu'}</Badge>
            <Badge bg="secondary" className="px-2 py-1">{laptop.categoryName || 'Loại'}</Badge>
          </div>

          <h3 className="text-danger fw-bold mb-3">
            {formatPrice ? formatPrice(laptop.price) : `${laptop.price} VNĐ`}
          </h3>

          <p className="text-muted mb-4">{laptop.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>

          <Button
            variant="primary"
            size="lg"
            className="px-4 shadow-sm"
            onClick={() => addToCart(laptop)}
          >
            🛒 Thêm vào giỏ hàng
          </Button>
        </Col>
      </Row>

      {/* Phần Đánh Giá Chuyên Nghiệp */}
      <Row className="mt-5 border-top pt-4">
        <Col md={7} className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <h4 className="fw-bold mb-0 me-2">Đánh giá sản phẩm</h4>
            <Badge bg="primary" pill>{reviews.length}</Badge>
          </div>

          {reviews.length === 0 ? (
            <Alert variant="light" className="border text-center text-muted py-4">
              Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét sản phẩm này!
            </Alert>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id || Math.random()} className="mb-3 shadow-sm border-0">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold"
                      style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}
                    >
                      {(rev.userName || 'K').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{rev.userName || 'Khách hàng'}</h6>
                      <span className="text-warning fw-bold me-2" style={{ fontSize: '0.95rem' }}>
                        {renderStars(rev.rating || 5)}
                      </span>
                      {rev.createdAt && (
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          • {rev.createdAt}
                        </small>
                      )}
                    </div>
                  </div>
                  <p className="mb-0 text-secondary ps-5" style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                    {rev.comment}
                  </p>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>

        {/* Form Viết Đánh Giá Mới */}
        <Col md={5}>
          <Card className="p-4 shadow-sm border-0 rounded-3 bg-light">
            <h5 className="fw-bold mb-3 text-dark">Viết nhận xét của bạn</h5>

            {submitMessage && (
              <Alert variant={submitMessage.type} dismissible onClose={() => setSubmitMessage(null)}>
                {submitMessage.text}
              </Alert>
            )}

            <Form onSubmit={handleReviewSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary">Tên của bạn</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên của bạn (không bắt buộc)..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary">Mức độ hài lòng</Form.Label>
                <Form.Select value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="5">★★★★★ (5/5) - Rất hài lòng</option>
                  <option value="4">★★★★☆ (4/5) - Hài lòng</option>
                  <option value="3">★★★☆☆ (3/5) - Bình thường</option>
                  <option value="2">★★☆☆☆ (2/5) - Không hài lòng</option>
                  <option value="1">★☆☆☆☆ (1/5) - Rất tệ</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary">Nội dung đánh giá</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Chia sẻ chi tiết trải nghiệm sử dụng sản phẩm..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100 fw-bold py-2" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : 'Gửi đánh giá'}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}