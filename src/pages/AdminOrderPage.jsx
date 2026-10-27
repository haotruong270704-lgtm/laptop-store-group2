import { useEffect, useState } from 'react';
import { Container, Table, Badge, Form, Card, Spinner, Alert, Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import orderApi from '../api/orderApi';

// Cấu hình danh sách trạng thái dự phòng
const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xử lý', variant: 'warning' },
  { value: 'Processing', label: 'Đang xử lý', variant: 'info' },
  { value: 'Shipped', label: 'Đang giao', variant: 'primary' },
  { value: 'Completed', label: 'Đã hoàn thành', variant: 'success' },
  { value: 'Cancelled', label: 'Đã hủy', variant: 'danger' },
];

export default function AdminOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Modal xem chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gọi trực tiếp API /orders để lấy tất cả đơn hàng không phân biệt userId
        const res = await axiosClient.get('/orders');
        const data = res?.data || res || [];
        
        console.log('📦 Danh sách đơn hàng từ server:', data);

        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
        if (isMounted) {
          setError('Không thể tải danh sách đơn hàng. Vui lòng kiểm tra lại server!');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý đổi trạng thái đơn hàng
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      if (orderApi.updateStatus) {
        await orderApi.updateStatus(orderId, newStatus);
      } else {
        await axiosClient.patch(`/orders/${orderId}`, { status: newStatus });
      }
      setOrders((prev) =>
        prev.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item))
      );
    } catch {
      alert('Cập nhật trạng thái thất bại!');
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper định dạng tiền tệ
  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
  };

  // Helper lấy thông tin badge trạng thái
  const getStatusBadge = (status) => {
    const item = STATUS_OPTIONS.find((s) => s.value.toLowerCase() === String(status).toLowerCase());
    return {
      label: item ? item.label : status,
      variant: item ? item.variant : 'secondary',
    };
  };

  // Lọc đơn hàng theo Status
  const filteredOrders = statusFilter
    ? orders.filter((item) => String(item.status).toLowerCase() === statusFilter.toLowerCase())
    : orders;

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải danh sách đơn hàng...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý Đơn hàng</h2>
          <p className="text-muted mb-0">Xem danh sách và cập nhật trạng thái đơn hàng của hệ thống</p>
        </div>
        <Link to="/admin/laptops" className="btn btn-outline-primary fw-semibold">
          💻 Quản lý Laptop
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Bộ lọc trạng thái */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3">
          <div className="d-flex align-items-center gap-3">
            <Form.Label className="mb-0 fw-semibold text-secondary" style={{ minWidth: '130px' }}>
              Lọc theo trạng thái:
            </Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '280px' }}
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      {/* Bảng Đơn hàng */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '90px' }}>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th style={{ width: '180px' }}>Đổi trạng thái</th>
                <th className="text-end" style={{ width: '100px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Không tìm thấy đơn hàng nào!
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id}>
                      <td className="fw-bold">#{order.id}</td>
                      <td>
                        <div><strong>{order.customerName || order.fullName || order.name || 'Khách hàng'}</strong></div>
                        <small className="text-muted">{order.phone || order.email || ''}</small>
                      </td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td className="text-danger fw-bold">
                        {formatMoney(order.totalAmount || order.totalPrice || order.total || 0)}
                      </td>
                      <td>
                        <Badge bg={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Xem chi tiết đơn hàng */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            Chi tiết đơn hàng #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <p className="mb-1"><strong>Khách hàng:</strong> {selectedOrder.customerName || selectedOrder.fullName || selectedOrder.name || 'N/A'}</p>
                  <p className="mb-1"><strong>Số điện thoại:</strong> {selectedOrder.phone || 'N/A'}</p>
                  <p className="mb-1"><strong>Địa chỉ:</strong> {selectedOrder.address || 'N/A'}</p>
                </div>
                <div className="col-md-6 text-md-end">
                  <p className="mb-1">
                    <strong>Trạng thái: </strong>
                    <Badge bg={getStatusBadge(selectedOrder.status).variant}>
                      {getStatusBadge(selectedOrder.status).label}
                    </Badge>
                  </p>
                  <p className="mb-1"><strong>Ngày tạo:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
                </div>
              </div>

              <h6 className="fw-bold mt-4 mb-2">Danh sách sản phẩm</h6>
              <Table size="sm" bordered responsive>
                <thead className="table-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th className="text-center">Số lượng</th>
                    <th className="text-end">Đơn giá</th>
                    <th className="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || selectedOrder.cartItems || selectedOrder.orderItems || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name || item.laptopName || item.laptop?.name || `Sản phẩm #${item.laptopId || item.id}`}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{formatMoney(item.price || item.laptop?.price)}</td>
                      <td className="text-end">{formatMoney((item.price || item.laptop?.price || 0) * (item.quantity || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="text-end fw-bold text-danger fs-5 mt-3">
                Tổng cộng: {formatMoney(selectedOrder.totalAmount || selectedOrder.totalPrice || selectedOrder.total || 0)}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}