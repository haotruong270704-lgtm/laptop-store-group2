import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Col,
  Container,
  Form,
  Image,
  InputGroup,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs,
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import laptopApi from '../api/laptopApi';
import reviewApi from '../api/reviewApi';
import orderApi from '../api/orderApi';
import { getErrorMessage, isCancel } from '../api/axiosClient';
import useAxios from '../hooks/useAxios';
import useAddToCart from '../hooks/useAddToCart';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Price from '../components/common/Price';
import StarRating from '../components/common/StarRating';
import Loading from '../components/common/Loading';
import ErrorAlert from '../components/common/ErrorAlert';
import LaptopGrid from '../components/laptop/LaptopGrid';
import ReviewList from '../components/laptop/ReviewList';
import ReviewForm from '../components/laptop/ReviewForm';
import NotFoundPage from './NotFoundPage';
import { handleImageError } from '../utils/image';
import { getLaptopImage, getLaptopGallery } from '../utils/laptopImages';
import dbData from '../../db.json';

async function loadDetail(id, signal) {
  let laptop;
  try {
    laptop = await laptopApi.getById(id, signal);
  } catch (err) {
    if (isCancel(err)) throw err;
    // Fallback từ dbData
    const found = dbData.laptops.find((l) => String(l.id) === String(id));
    if (!found) {
      throw new Error('Không tìm thấy dữ liệu laptop');
    }
    const brand = dbData.brands.find((b) => b.id === found.brandId);
    const category = dbData.categories.find((c) => c.id === found.categoryId);
    laptop = { ...found, brand, category };
  }

  const [reviewsResult, relatedResult] = await Promise.allSettled([
    reviewApi.getByLaptop(id, signal),
    laptopApi.getRelated(laptop, signal),
  ]);

  let reviews = [];
  let reviewsError = null;
  if (reviewsResult.status === 'fulfilled') {
    reviews = reviewsResult.value;
  } else {
    // Fallback reviews
    const fallbackReviews = (dbData.reviews || []).filter((r) => String(r.laptopId) === String(id));
    reviews = fallbackReviews;
    if (fallbackReviews.length === 0) {
      reviewsError = getErrorMessage ? getErrorMessage(reviewsResult.reason) : 'Không tải được đánh giá';
    }
  }

  let related = [];
  let relatedError = null;
  if (relatedResult.status === 'fulfilled') {
    related = relatedResult.value;
  } else {
    related = (dbData.laptops || [])
      .filter((l) => l.categoryId === laptop.categoryId && String(l.id) !== String(laptop.id))
      .slice(0, 4);
    if (related.length === 0) {
      relatedError = 'Không tải được laptop liên quan';
    }
  }

  return {
    laptop,
    reviews,
    reviewsError,
    related,
    relatedError,
  };
}

const storageLabel = (gb) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);

export default function LaptopDetailPage() {
  const { id } = useParams();

  // F7. /laptops/abc (id không phải số) → 404
  if (!/^\d+$/.test(id)) return <NotFoundPage />;

  return <LaptopDetail key={id} id={id} />;
}

function LaptopDetail({ id }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { add, adding } = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const { data, loading, error, refetch, setData } = useAxios((signal) => loadDetail(id, signal), [id]);
  const laptop = data?.laptop;
  usePageTitle(laptop?.name ?? 'Chi tiết laptop');

  const gallery = laptop ? getLaptopGallery(laptop) : [];
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (laptop) {
      setSelectedImage(getLaptopImage(laptop));
    }
  }, [laptop]);

  // Kiểm tra điều kiện: chỉ đơn hàng nào đã hoàn thành mới được phép đánh giá sản phẩm
  useEffect(() => {
    let active = true;

    if (!user) {
      setCanReview(false);
      setCheckingEligibility(false);
      return;
    }

    const checkOrderEligibility = async () => {
      setCheckingEligibility(true);
      try {
        let userOrders = [];
        try {
          userOrders = await orderApi.getByUser(user.id);
        } catch {
          userOrders = [];
        }

        // Kiểm tra thêm đơn hàng lưu trong localStorage (nếu json-server offline)
        try {
          const localOrders = JSON.parse(localStorage.getItem('laptop_orders') || '[]');
          const userLocalOrders = localOrders.filter(
            (o) => String(o.userId) === String(user.id) || o.userId === user.id
          );
          userOrders = [...userOrders, ...userLocalOrders];
        } catch { }

        // Kiểm tra xem có đơn hàng nào thuộc trạng thái Completed/Done có chứa sản phẩm này không
        const hasCompleted = userOrders.some((order) => {
          const status = String(order.status || '').toLowerCase().trim();
          const isDone = ['completed', 'done', 'hoàn thành', 'đã giao'].includes(status);
          if (!isDone) return false;

          return order.items?.some(
            (item) => String(item.laptopId) === String(id) || String(item.id) === String(id)
          );
        });

        if (active) {
          setCanReview(hasCompleted);
        }
      } catch {
        if (active) setCanReview(false);
      } finally {
        if (active) setCheckingEligibility(false);
      }
    };

    checkOrderEligibility();
    return () => {
      active = false;
    };
  }, [user, id]);

  /** G2 + BR-07. Gửi đánh giá */
  const handleReview = async ({ rating, comment }) => {
    if (!canReview) {
      showToast('Chỉ đơn hàng đã hoàn thành mới được phép đánh giá sản phẩm', 'warning');
      return false;
    }

    setSubmittingReview(true);
    try {
      const reviewPayload = {
        laptopId: Number(laptop.id) || laptop.id,
        userId: user.id,
        userName: user.fullName || user.email || 'Khách hàng',
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      let review;
      try {
        review = await reviewApi.create(reviewPayload);
      } catch {
        // Fallback lưu local nếu json-server lỗi
        review = { ...reviewPayload, id: Date.now() };
      }

      // Cập nhật điểm trung bình của laptop
      const reviews = [review, ...(data?.reviews || [])];
      const avg = Math.round((reviews.reduce((s, r) => s + Number(r.rating || 5), 0) / reviews.length) * 10) / 10;
      try {
        await laptopApi.patch(laptop.id, { rating: avg });
      } catch { }

      setData((prev) => ({
        ...prev,
        reviews,
        laptop: { ...prev.laptop, rating: avg },
      }));

      showToast('Cảm ơn bạn đã gửi đánh giá sản phẩm!');
      return true;
    } catch (err) {
      showToast(getErrorMessage ? getErrorMessage(err) : (err.message || 'Lỗi gửi đánh giá'), 'danger');
      return false;
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loading text="Đang tải thông tin laptop..." />;
  if (error || !laptop)
    return (
      <Container className="py-4">
        <ErrorAlert message={error || 'Không tìm thấy thông tin sản phẩm'} onRetry={refetch} />
        <Button variant="link" onClick={() => navigate('/laptops')} className="px-0">
          ← Về danh sách laptop
        </Button>
      </Container>
    );

  const outOfStock = (laptop.stock ?? 0) <= 0;
  const alreadyReviewed = user && data?.reviews?.some((r) => String(r.userId) === String(user.id));

  return (
    <Container className="py-4">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Trang chủ
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/laptops' }}>
          Laptop
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{laptop.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4 mb-5">
        <Col md={5}>
          <div className="p-3 bg-white border rounded-3 text-center shadow-sm mb-3">
            <Image
              src={selectedImage || getLaptopImage(laptop)}
              alt={laptop.name}
              fluid
              rounded
              style={{ maxHeight: 380, objectFit: 'contain', width: '100%' }}
              onError={handleImageError}
            />
          </div>

          {/* Thumbnail Gallery */}
          {gallery.length > 1 && (
            <div className="d-flex gap-2 justify-content-center overflow-auto pb-1">
              {gallery.map((imgUrl, idx) => {
                const isSelected = (selectedImage || getLaptopImage(laptop)) === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`btn p-1 border rounded-2 ${isSelected ? 'border-primary border-2 shadow-sm' : 'border-light-subtle'}`}
                    style={{ width: 72, height: 54, background: '#fff' }}
                    title={`Góc nhìn ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${laptop.name} view ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={handleImageError}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </Col>

        <Col md={7}>
          <h2 className="fw-bold mb-2">{laptop.name}</h2>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            {laptop.brand && (
              <Badge as={Link} to={`/laptops?brandId=${laptop.brandId}`} bg="dark" className="text-decoration-none">
                {laptop.brand.name}
              </Badge>
            )}
            {laptop.category && (
              <Badge as={Link} to={`/laptops?categoryId=${laptop.categoryId}`} bg="primary" className="text-decoration-none">
                {laptop.category.name}
              </Badge>
            )}
            <StarRating value={laptop.rating || 5} />
            <span className="text-secondary small">· Đã bán {laptop.sold || 0}</span>
          </div>

          <div className="my-3">
            <Price laptop={laptop} size="lg" />
          </div>

          <p className="text-secondary" style={{ lineHeight: 1.6 }}>{laptop.description}</p>

          <p className="mb-4">
            <span className="fw-semibold me-2">Tình trạng:</span>
            {outOfStock ? (
              <Badge bg="secondary" className="px-2 py-1">Hết hàng</Badge>
            ) : (
              <Badge bg="success" className="px-2 py-1">Còn {laptop.stock} sản phẩm</Badge>
            )}
          </p>

          <div className="d-flex flex-wrap gap-3 align-items-center">
            <InputGroup style={{ width: 130 }}>
              <Button
                variant="outline-secondary"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock || quantity <= 1}
              >
                −
              </Button>
              <Form.Control
                value={quantity}
                readOnly
                className="text-center fw-bold"
                aria-label="Số lượng"
              />
              <Button
                variant="outline-secondary"
                onClick={() => setQuantity((q) => Math.min(laptop.stock, q + 1))}
                disabled={outOfStock || quantity >= laptop.stock}
              >
                +
              </Button>
            </InputGroup>

            <Button
              size="lg"
              variant="primary"
              className="fw-bold px-4"
              disabled={outOfStock || adding}
              onClick={() => add(laptop, quantity)}
            >
              {adding && <Spinner size="sm" className="me-2" animation="border" />}
              🛒 Thêm vào giỏ
            </Button>

            <Button variant="outline-secondary" size="lg" onClick={() => navigate(-1)}>
              ← Quay lại
            </Button>
          </div>
        </Col>
      </Row>

      <Tabs defaultActiveKey="specs" className="mb-4" id="laptop-tabs">
        <Tab eventKey="specs" title="Thông số kỹ thuật">
          <Table striped bordered hover responsive className="bg-white shadow-sm rounded">
            <tbody>
              <tr><th style={{ width: 220 }}>CPU</th><td>{laptop.cpu || '—'}</td></tr>
              <tr><th>RAM</th><td>{laptop.ram ? `${laptop.ram} GB` : '—'}</td></tr>
              <tr><th>Ổ cứng</th><td>{laptop.storage ? `SSD ${storageLabel(laptop.storage)}` : '—'}</td></tr>
              <tr><th>Màn hình</th><td>{laptop.screen || '—'}</td></tr>
              <tr><th>Card đồ họa (GPU)</th><td>{laptop.gpu || '—'}</td></tr>
              <tr><th>Cân nặng</th><td>{laptop.weight ? `${laptop.weight} kg` : '—'}</td></tr>
              <tr><th>Thương hiệu</th><td>{laptop.brand?.name || '—'}</td></tr>
              <tr><th>Phân loại</th><td>{laptop.category?.name || '—'}</td></tr>
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="reviews" title={`Đánh giá (${data?.reviews?.length || 0})`}>
          {data?.reviewsError ? (
            <Alert variant="warning">Không tải được đánh giá. {data.reviewsError}</Alert>
          ) : (
            <div className="bg-white p-3 p-md-4 rounded shadow-sm">
              {!user && (
                <Alert variant="light" className="border">
                  Vui lòng{' '}
                  <Link to="/login" state={{ from: { pathname: `/laptops/${laptop.id}` } }}>
                    đăng nhập
                  </Link>{' '}
                  để viết đánh giá sản phẩm.
                </Alert>
              )}

              {user && checkingEligibility && (
                <div className="text-muted small py-2">
                  <Spinner size="sm" className="me-2" animation="border" /> Đang kiểm tra điều kiện đánh giá...
                </div>
              )}

              {user && !checkingEligibility && canReview && !alreadyReviewed && (
                <ReviewForm onSubmit={handleReview} submitting={submittingReview} />
              )}

              <ReviewList reviews={data?.reviews || []} />
            </div>
          )}
        </Tab>
      </Tabs>

      <section className="mt-5 pt-3">
        <h4 className="fw-bold mb-4">Laptop cùng loại</h4>
        {data?.relatedError ? (
          <Alert variant="warning">Không tải được laptop liên quan.</Alert>
        ) : (
          <LaptopGrid laptops={data?.related || []} loading={false} />
        )}
      </section>
    </Container>
  );
}