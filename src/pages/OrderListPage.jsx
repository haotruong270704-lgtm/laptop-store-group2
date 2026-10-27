import { useState } from 'react';
import { Badge, Button, Card, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import dbData from '../../db.json';

/** G4. Đơn hàng của khách */
export default function OrderListPage() {
  usePageTitle('Đơn hàng của tôi');
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchOrders = async (signal) => {
    const userId = user?.id || 2;
    try {
      const data = await orderApi.getByUser(userId, signal);
      // Kết hợp các đơn hàng offline vừa đặt trong localStorage nếu có
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const combined = [...localOrders, ...(data || [])];
      // Khử trùng ID
      const unique = Array.from(new Map(combined.map((o) => [o.id, o])).values());
      return unique;
    } catch (err) {
      if (isCancel(err)) throw err;
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const seedOrders = (dbData.orders || []).filter((o) => o.userId === userId);
      return [...localOrders, ...seedOrders];
    }
  };

  const { data: orders, loading, error, refetch, setData } = useAxios(fetchOrders, [user?.id]);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  /** BR-05. Hủy đơn: PATCH status + cộng lại tồn kho cho từng laptop (song song) */
  const confirmCancel = async () => {
    const order = orderToCancel;
    setCancelling(true);
    try {
      let updated;
      try {
        updated = await orderApi.updateStatus(order.id, 'cancelled');
      } catch {
        updated = { ...order, status: 'cancelled' };
      }

      // Cập nhật lại trong localStorage nếu có
      try {
        const local = JSON.parse(localStorage.getItem('orders') || '[]');
        const updatedLocal = local.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o));
        localStorage.setItem('orders', JSON.stringify(updatedLocal));
      } catch {
        // ignore
      }

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

      setData((list) => (list || []).map((o) => (o.id === order.id ? updated : o)));
      showToast(`Đã hủy đơn #${order.id}`, 'info');
    } catch (err) {
      showToast(getErrorMessage ? getErrorMessage(err) : err.message, 'danger');
    } finally {
      setCancelling(false);
      setOrderToCancel(null);
    }
  };

  if (loading && (!orders || orders.length === 0)) return <Loading text="Đang tải đơn hàng..." />;
  if (error && (!orders || orders.length === 0)) return <ErrorAlert message={error} onRetry={refetch} />;

  return (
    <>
      <h3 className="fw-bold mb-3">Đơn hàng của tôi</h3>

      {!orders || orders.length === 0 ? (
        <EmptyState icon="📦" message="Bạn chưa có đơn hàng nào">
          <Button as={Link} to="/laptops">
            Mua sắm ngay
          </Button>
        </EmptyState>
      ) : (
        orders.map((order) => {
          const status = getStatus(order.status);
          return (
            <Card key={order.id} className="mb-3 shadow-sm">
              <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span>
                  <strong>Đơn #{order.id}</strong>
                  <span className="text-secondary ms-2 small">{formatDateTime(order.createdAt)}</span>
                </span>
                <Badge bg={status.variant}>{status.label}</Badge>
              </Card.Header>
              <Table responsive className="mb-0 align-middle" size="sm">
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.laptopId}>
                      <td className="ps-3">
                        <Link to={`/laptops/${item.laptopId}`} className="text-decoration-none fw-medium">
                          {item.name}
                        </Link>
                      </td>
                      <td className="text-end text-nowrap">
                        {formatPrice(item.price)} × {item.quantity}
                      </td>
                      <td className="text-end text-nowrap pe-3">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Card.Footer className="d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white">
                <small className="text-secondary">
                  {order.customer?.fullName} · {order.customer?.phone} · {order.customer?.address}
                </small>
                <div className="d-flex align-items-center gap-3">
                  <span>
                    Tổng: <strong className="text-danger">{formatPrice(order.total)}</strong>
                  </span>
                  {order.status === 'pending' && (
                    <Button size="sm" variant="outline-danger" onClick={() => setOrderToCancel(order)}>
                      Hủy đơn
                    </Button>
                  )}
                </div>
              </Card.Footer>
            </Card>
          );
        })
      )}

      <ConfirmModal
        show={Boolean(orderToCancel)}
        title="Hủy đơn hàng"
        message={orderToCancel && `Bạn có chắc muốn hủy đơn #${orderToCancel.id}?`}
        confirmText="Hủy đơn"
        cancelText="Không"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setOrderToCancel(null)}
      />
    </>
  );
}
