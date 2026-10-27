import { ListGroup } from 'react-bootstrap';
import StarRating from '../common/StarRating';
import EmptyState from '../common/EmptyState';
import { formatDate } from '../../utils/format';

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <EmptyState icon="💬" message="Chưa có đánh giá nào. Hãy là người đầu tiên!" />;
  }

  return (
    <ListGroup variant="flush">
      {reviews.map((review) => (
        <ListGroup.Item key={review.id || Math.random()} className="px-0 py-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap mb-1">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{ width: 32, height: 32, fontSize: '0.85rem' }}
              >
                {(review.userName || 'K').charAt(0).toUpperCase()}
              </div>
              <strong className="text-dark">{review.userName ?? 'Khách hàng'}</strong>
            </div>
            <small className="text-secondary">{formatDate(review.createdAt)}</small>
          </div>
          <div className="ms-4 ps-2">
            <StarRating value={review.rating} showValue={false} />
            <p className="mb-0 mt-1 text-secondary" style={{ lineHeight: 1.5 }}>
              {review.comment}
            </p>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
