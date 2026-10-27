import { useState } from 'react';
import { Button, ButtonGroup, Card, Form, Spinner } from 'react-bootstrap';

/** G2 + BR-07. Form viết đánh giá: chọn 1–5 sao, nội dung ≥ 10 ký tự */
export default function ReviewForm({ onSubmit, submitting }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);

  const error = comment.trim().length < 10 ? 'Nội dung đánh giá phải có ít nhất 10 ký tự' : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    const ok = await onSubmit({ rating, comment: comment.trim() });
    if (ok) {
      setComment('');
      setRating(5);
      setTouched(false);
    }
  };

  return (
    <Card className="mb-4 bg-light border-0 shadow-sm rounded-3">
      <Card.Body className="p-3 p-md-4">
        <Form noValidate onSubmit={handleSubmit}>
          <Form.Label className="fw-semibold text-dark mb-2">Đánh giá của bạn</Form.Label>
          <div className="mb-3 d-flex align-items-center">
            <ButtonGroup aria-label="Chọn số sao">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant={star <= rating ? 'warning' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setRating(star)}
                  aria-label={`${star} sao`}
                  className="px-2"
                >
                  ★
                </Button>
              ))}
            </ButtonGroup>
            <span className="ms-2 small fw-bold text-secondary">{rating} / 5 sao</span>
          </div>

          <Form.Group controlId="review-comment" className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này (tối thiểu 10 ký tự)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => setTouched(true)}
              isInvalid={touched && Boolean(error)}
            />
            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
          </Form.Group>

          <Button type="submit" variant="primary" className="fw-semibold px-4" disabled={submitting}>
            {submitting && <Spinner size="sm" className="me-2" animation="border" />}
            Gửi đánh giá
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
