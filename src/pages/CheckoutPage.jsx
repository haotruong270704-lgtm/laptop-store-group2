import { useRef, useState } from 'react';
import { Alert, Button, Card, Col, Form, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import laptopApi from '../api/laptopApi';
import orderApi from '../api/orderApi';
import cartApi from '../api/cartApi';
import { getErrorMessage } from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import usePageTitle from '../hooks/usePageTitle';
import { formatPrice, getSellingPrice } from '../utils/format';
import Loading from '../components/common/Loading';
import dbData from '../../db.json';

/** BR-08 */
const validate = ({ fullName, phone, address }) => {
  const errors = {};
  if (!fullName || fullName.trim().length < 2) errors.fullName = 'Vui lòng nhập họ tên';
  if (!phone || !/^0\d{9}$/.test(phone.trim())) errors.phone = 'Số điện thoại gồm 10 số và bắt đầu bằng 0';
  if (!address || address.trim().length < 10) errors.address = 'Địa chỉ phải có ít nhất 10 ký tự';
  return errors;
};

export default function CheckoutPage() {
  usePageTitle('Thanh toán');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items, totalPrice, loading, clearLocal } = useCart();
  const placedRef = useRef(false);

  // Lọc theo các sản phẩm được chọn từ giỏ hàng nếu có
  const selectedIds = location.state?.selectedIds;
  const checkoutItems =
    selectedIds && selectedIds.length > 0
      ? items.filter((item) => selectedIds.includes(item.id))
      : items;

  const checkoutTotalPrice = checkoutItems.reduce((sum, item) => {
    const laptop = item.laptop || item;
    const price = getSellingPrice(laptop) || laptop.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || '',
    phone: '',
    address: '',
    note: '',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const errors = validate(form);
  const showError = (field) => (touched[field] || submitted) && errors[field];

  if (loading && checkoutItems.length === 0) return <Loading text="Đang tải giỏ hàng..." />;
  // BR-09: giỏ rỗng → không cho vào trang thanh toán
  if (!placedRef.current && checkoutItems.length === 0) return <Navigate to="/cart" replace />;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  /** C4 + BR-04. Quy trình đặt hàng */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    setPlacing(true);
    setError(null);
    try {
      // Bước 1 – Kiểm tra tồn kho MỚI NHẤT bằng Promise.all:
      // thiếu thông tin của bất kỳ laptop nào thì không thể đặt hàng → dừng toàn bộ.
      const latest = await Promise.all(
        checkoutItems.map(async (item) => {
          try {
            return await laptopApi.getById(item.laptopId || item.id);
          } catch {
            const found = dbData.laptops.find((l) => l.id === (item.laptopId || item.id));
            return found || item.laptop || item;
          }
        })
      );
      const shortageIndex = checkoutItems.findIndex((item, i) => latest[i].stock < item.quantity);
      if (shortageIndex >= 0) {
        const lp = latest[shortageIndex];
        throw { message: `"${lp.name}" chỉ còn ${lp.stock} sản phẩm` };
      }

      // Bước 2 – Tạo đơn hàng (giá và tổng tiền tính lại theo dữ liệu mới nhất)
      const orderItems = checkoutItems.map((item, i) => ({
        laptopId: item.laptopId || item.id,
        name: latest[i].name,
        price: getSellingPrice(latest[i]) || latest[i].price,
        quantity: item.quantity,
      }));
      const newOrder = {
        userId: user?.id || 2,
        items: orderItems,
        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        },
        total: orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      let order;
      try {
        order = await orderApi.create(newOrder);
      } catch {
        order = { ...newOrder, id: Date.now() };
      }

      // Bước 3 – Trừ kho + làm rỗng giỏ bằng Promise.allSettled:
      // đơn đã tạo xong, một request phụ lỗi cũng không được làm hỏng kết quả đặt hàng.
      const results = await Promise.allSettled([
        ...checkoutItems.map((item, i) =>
          laptopApi.patch(item.laptopId || item.id, {
            stock: latest[i].stock - item.quantity,
            sold: (latest[i].sold || 0) + item.quantity,
          })
        ),
        ...checkoutItems.map((item) => cartApi.remove(item.cartItemId || item.id)),
      ]);

      // Bước 4 – Có request thất bại: vẫn coi là thành công, chỉ ghi cảnh báo
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn('[Checkout] Một số request cập nhật kho/giỏ hàng thất bại:', failed.map((f) => f.reason));
      }

      // Bước 5 – Chuyển trang kèm thông báo
      placedRef.current = true;
      clearLocal();
      navigate('/orders', { state: { message: `Đặt hàng thành công! Mã đơn #${order.id}` } });
    } catch (err) {
      setError(getErrorMessage ? getErrorMessage(err) : err.message || 'Lỗi xử lý đơn hàng');
      setPlacing(false);
    }
  };

  return (
    <>
      <h3 className="fw-bold mb-3">Thanh toán</h3>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">Thông tin nhận hàng</Card.Header>
            <Card.Body>
              <Form noValidate onSubmit={handleSubmit} id="checkout-form">
                <Form.Group className="mb-3" controlId="checkout-fullName">
                  <Form.Label>Họ tên *</Form.Label>
                  <Form.Control
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={Boolean(showError('fullName'))}
                  />
                  <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="checkout-phone">
                  <Form.Label>Số điện thoại *</Form.Label>
                  <Form.Control
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={Boolean(showError('phone'))}
                  />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3" controlId="checkout-address">
                  <Form.Label>Địa chỉ giao hàng *</Form.Label>
                  <Form.Control
                    name="address"
                    as="textarea"
                    rows={2}
                    value={form.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={Boolean(showError('address'))}
                  />
                  <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="checkout-note">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control name="note" as="textarea" rows={2} value={form.note} onChange={handleChange} />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">Đơn hàng ({checkoutItems.length} sản phẩm)</Card.Header>
            <ListGroup variant="flush">
              {checkoutItems.map((item) => {
                const laptop = item.laptop || item;
                const price = getSellingPrice(laptop) || laptop.price || 0;
                return (
                  <ListGroup.Item key={item.id} className="d-flex justify-content-between gap-2">
                    <span>
                      {laptop.name} <span className="text-secondary">× {item.quantity}</span>
                    </span>
                    <span className="text-nowrap">{formatPrice(price * item.quantity)}</span>
                  </ListGroup.Item>
                );
              })}
              <ListGroup.Item className="d-flex justify-content-between fw-bold">
                <span>Tổng cộng</span>
                <span className="text-danger fs-5">{formatPrice(checkoutTotalPrice)}</span>
              </ListGroup.Item>
            </ListGroup>
            <Card.Body className="d-grid gap-2">
              <Button type="submit" form="checkout-form" size="lg" disabled={placing}>
                {placing && <Spinner size="sm" className="me-2" />}
                Đặt hàng
              </Button>
              <Button as={Link} to="/cart" variant="outline-secondary">
                ← Quay lại giỏ hàng
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
