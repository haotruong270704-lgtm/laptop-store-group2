import { useState } from 'react';
import { Alert, Badge, Breadcrumb, Button, Card, Col, Image, Row, Table } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import orderApi from '../api/orderApi';
import laptopApi from '../api/laptopApi';
import { getErrorMessage, isCancel } from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useAxios from '../hooks/useAxios';
import usePageTitle from '../hooks/usePageTitle';
import { formatDateTime, formatPrice } from '../utils/format';
import { getStatus } from '../utils/orderStatus';
import Loading from '../components/common/Loading';
import ErrorAlert from '../components/common/ErrorAlert';
import ConfirmModal from '../components/common/ConfirmModal';
import { handleImageError } from '../utils/image';
import dbData from '../../db.json';

export default function OrderDetailPage() {
  const { id } = useParams();
  usePageTitle(`Chi tiết đơn hàng #${id}`);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchOrderDetail = async (signal) => {
    try {
      return await orderApi.getById(id, signal);
    } catch (err) {
      if (isCancel(err)) throw err;
      // Fallback từ localStorage
      const local = JSON.parse(localStorage.getItem('orders') || '[]');
      const foundLocal = local.find((o) => String(o.id) === String(id));
      if (foundLocal) return foundLocal;

      // Fallback từ dbData
      const foundDb = (dbData.orders || []).find((o) => String(o.id) === String(id));
      if (foundDb) return foundDb;

      throw { message: `Không tìm thấy đơn hàng #${id}` };
    }
  };

  const { data: order, loading, error, refetch, setData } = useAxios(fetchOrderDetail, [id]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  /** Hủy đơn: PATCH status + hoàn kho */
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      let updated;
      try {
        updated = await orderApi.updateStatus(order.id, 'cancelled');
      } catch {
        updated = { ...order, status: 'cancelled' };
      }

      // Cập nhật lại localStorage nếu có
      try {
        const local = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedLocal = local.map((o) =>
          String(o.id) === String(order.id) ? { ...o, status: 'cancelled' } : o
        );
        localStorage.setItem('orders', JSON.stringify(updatedLocal));
      } catch {
        // ignore
      }

      // Hoàn kho
      const results = await Promise.allSettled(
        (order.items || []).map(async (item) => {
          let currentStock = 10;
          let currentSold = 0;
          try {
            const laptop = await laptopApi.getById(item.laptopId);
            currentStock = laptop.stock;
            currentSold = laptop.sold || 0;
          } catch {
            const found = dbData.laptops.find((l) => l.id === item.laptopId);
            if (found) {
              currentStock = found.stock;
              currentSold = found.sold || 0;
            }
          }
          return laptopApi.patch(item.laptopId, {
            stock: currentStock + item.quantity,
            sold: Math.max(0, currentSold - item.quantity),
          });
        })
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) console.warn('[Order] Hoàn kho thất bại:', failed.map((f) => f.reason));

      setData(updated);
      showToast(`Đã hủy đơn hàng #${order.id}`, 'info');
    } catch (err) {
      showToast(getErrorMessage ? getErrorMessage(err) : err.message, 'danger');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (loading) return <Loading text="Đang tải chi tiết đơn hàng..." />;
  if (error) {
    return (
      <div className="py-4">
        <ErrorAlert message={error} onRetry={refetch} />
        <Button variant="link" onClick={() => navigate('/orders')}>
          ← Quay lại danh sách đơn hàng
        </Button>
      </div>
    );
  }

  if (!order) return null;

  const status = getStatus(order.status);

  return (
    <>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Trang chủ
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/orders' }}>
          Đơn hàng của tôi
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Đơn #{order.id}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h3 className="fw-bold mb-1">Chi tiết đơn hàng #{order.id}</h3>
          <span className="text-muted">Ngày đặt: {formatDateTime(order.createdAt)}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold">Trạng thái:</span>
          <Badge bg={status.variant} className="fs-6 py-2 px-3">
            {status.label}
          </Badge>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="fw-semibold">Thông tin người nhận</Card.Header>
            <Card.Body>
              <p className="mb-2">
                <strong>Họ tên:</strong> {order.customer?.fullName || '—'}
              </p>
              <p className="mb-2">
                <strong>Số điện thoại:</strong> {order.customer?.phone || '—'}
              </p>
              <p className="mb-2">
                <strong>Địa chỉ giao hàng:</strong> {order.customer?.address || '—'}
              </p>
              {order.customer?.note && (
                <p className="mb-0 text-muted">
                  <strong>Ghi chú:</strong> {order.customer.note}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="fw-semibold">Tóm tắt thanh toán</Card.Header>
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Phương thức:</span>
                  <span className="fw-medium">Thanh toán khi nhận hàng (COD)</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Phí vận chuyển:</span>
                  <span className="text-success fw-medium">Miễn phí</span>
                </div>
              </div>
              <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                <span className="fs-5 fw-bold">Tổng thanh toán:</span>
                <span className="fs-3 fw-bold text-danger">{formatPrice(order.total)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="fw-semibold">Danh sách sản phẩm ({order.items?.length || 0})</Card.Header>
        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Sản phẩm</th>
              <th className="text-end">Đơn giá</th>
              <th className="text-center">Số lượng</th>
              <th className="text-end">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => {
              // Tìm ảnh nếu có trong dbData
              const lp = dbData.laptops.find((l) => l.id === item.laptopId);
              return (
                <tr key={item.laptopId}>
                  <td style={{ minWidth: 260 }}>
                    <div className="d-flex align-items-center gap-3">
                      {lp?.image && (
                        <Image
                          src={lp.image}
                          alt=""
                          width={64}
                          rounded
                          className="border"
                          onError={handleImageError}
                        />
                      )}
                      <Link to={`/laptops/${item.laptopId}`} className="text-decoration-none fw-medium text-dark">
                        {item.name}
                      </Link>
                    </div>
                  </td>
                  <td className="text-end text-nowrap">{formatPrice(item.price)}</td>
                  <td className="text-center fw-semibold">{item.quantity}</td>
                  <td className="text-end text-nowrap fw-bold text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <Card.Footer className="d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white py-3">
          <Button as={Link} to="/orders" variant="outline-secondary">
            ← Quay lại danh sách đơn hàng
          </Button>
          <div className="d-flex gap-2">
            {order.status === 'pending' && (
              <Button variant="danger" onClick={() => setShowCancelModal(true)}>
                Hủy đơn hàng này
              </Button>
            )}
            <Button as={Link} to="/laptops" variant="primary">
              Tiếp tục mua sắm
            </Button>
          </div>
        </Card.Footer>
      </Card>

      <ConfirmModal
        show={showCancelModal}
        title="Hủy đơn hàng"
        message={`Bạn có chắc chắn muốn hủy đơn hàng #${order.id}? Hành động này sẽ hoàn lại số lượng tồn kho.`}
        confirmText="Hủy đơn hàng"
        cancelText="Đóng"
        loading={cancelling}
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />
    </>
  );
}
