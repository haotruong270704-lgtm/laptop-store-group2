import { useEffect, useState } from 'react';
import { Alert, Button, ButtonGroup, Card, Form, Image, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../api/axiosClient';
import usePageTitle from '../hooks/usePageTitle';
import { formatPrice, getSellingPrice } from '../utils/format';
import { handleImageError } from '../utils/image';
import { getLaptopImage } from '../utils/laptopImages';
import Loading from '../components/common/Loading';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';

/** G1. Trang giỏ hàng – dữ liệu lưu thật trong /cartItems kèm hộp kiểm chọn sản phẩm */
export default function CartPage() {
  usePageTitle('Giỏ hàng');
  const navigate = useNavigate();
  const { items, loading, error, updateQuantity, removeItem, reload } = useCart();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);

  // Quản lý các ID sản phẩm được tick chọn (mặc định tick chọn tất cả)
  const [selectedIds, setSelectedIds] = useState(() => (items || []).map((i) => i.id));

  // Đồng bộ lại selectedIds khi danh sách items thay đổi
  useEffect(() => {
    setSelectedIds((prev) => {
      const currentIds = (items || []).map((i) => i.id);
      const remainingSelected = prev.filter((id) => currentIds.includes(id));
      // Nếu chưa có sản phẩm nào được chọn (hoặc mới thêm vào), tick chọn tất cả
      return remainingSelected.length > 0 ? remainingSelected : currentIds;
    });
  }, [items]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const changeQuantity = async (item, quantity) => {
    if (quantity < 1) {
      setItemToRemove(item); // BR-02: số lượng về 0 → hỏi xác nhận rồi xoá
      return;
    }
    setPendingId(item.id);
    try {
      await updateQuantity(item, quantity);
    } catch (err) {
      showToast(getErrorMessage ? getErrorMessage(err) : err.message, 'danger');
    } finally {
      setPendingId(null);
    }
  };

  /** H4. Optimistic: dòng biến mất ngay, lỗi thì CartContext khôi phục */
  const confirmRemove = async () => {
    const item = itemToRemove;
    setItemToRemove(null);
    setSelectedIds((prev) => prev.filter((id) => id !== item.id));
    try {
      await removeItem(item);
      showToast(`Đã xóa "${item.laptop?.name || item.name}" khỏi giỏ hàng`, 'info');
    } catch {
      showToast('Xóa thất bại, đã khôi phục', 'danger');
    }
  };

  if (loading && items.length === 0) return <Loading text="Đang tải giỏ hàng..." />;
  if (error) return <ErrorAlert message={error} onRetry={reload} />;

  if (!items || items.length === 0) {
    return (
      <EmptyState icon="🛒" message="Giỏ hàng của bạn đang trống">
        <Button as={Link} to="/laptops">
          Tiếp tục mua sắm
        </Button>
      </EmptyState>
    );
  }

  // Lấy các sản phẩm được tick chọn
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  // Tính tổng tiền CHỈ cho các sản phẩm được tick chọn
  const selectedTotalPrice = selectedItems.reduce((sum, item) => {
    const laptop = item.laptop || item;
    const price = getSellingPrice(laptop) || laptop.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const selectedTotalQuantity = selectedItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  // Tồn kho đã giảm sau khi thêm vào giỏ (người khác mua) → chặn đặt hàng
  const invalidItems = selectedItems.filter(
    (item) => item.quantity > (item.laptop?.stock ?? 99)
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Giỏ hàng</h3>
        {selectedItems.length > 0 && (
          <span className="text-muted">
            Đã chọn <strong>{selectedItems.length}</strong> / {items.length} loại sản phẩm
          </span>
        )}
      </div>

      {invalidItems.length > 0 && (
        <Alert variant="warning">
          {invalidItems.map((item) => (
            <div key={item.id}>
              "{item.laptop?.name || item.name}" chỉ còn {item.laptop?.stock} sản phẩm, vui lòng giảm số lượng.
            </div>
          ))}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: 48 }} className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả"
                />
              </th>
              <th>Sản phẩm</th>
              <th className="text-end">Đơn giá</th>
              <th className="text-center">Số lượng</th>
              <th className="text-end">Thành tiền</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const laptop = item.laptop || item;
              const price = getSellingPrice(laptop) || laptop.price || 0; // BR-03
              const busy = pendingId === item.id;
              const stock = laptop.stock ?? 99;
              const isChecked = selectedIds.includes(item.id);

              return (
                <tr key={item.id} className={isChecked ? 'table-light' : ''}>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(item.id)}
                      aria-label={`Chọn sản phẩm ${laptop.name}`}
                    />
                  </td>
                  <td style={{ minWidth: 240 }}>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center bg-white border rounded p-1"
                        style={{ width: 72, height: 54, flexShrink: 0 }}
                      >
                        <Image
                          src={getLaptopImage(laptop)}
                          alt={laptop.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={handleImageError}
                        />
                      </div>
                      <Link
                        to={`/laptops/${item.laptopId || laptop.id}`}
                        className="text-decoration-none fw-medium text-body"
                      >
                        {laptop.name}
                      </Link>
                    </div>
                  </td>
                  <td className="text-end text-nowrap">{formatPrice(price)}</td>
                  <td className="text-center">
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-secondary"
                        disabled={busy}
                        onClick={() => changeQuantity(item, item.quantity - 1)}
                        aria-label="Giảm"
                      >
                        −
                      </Button>
                      <Button variant="light" disabled className="px-3 text-body">
                        {item.quantity}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        disabled={busy || item.quantity >= stock}
                        onClick={() => changeQuantity(item, item.quantity + 1)}
                        aria-label="Tăng"
                      >
                        +
                      </Button>
                    </ButtonGroup>
                  </td>
                  <td className="text-end fw-semibold text-nowrap">
                    {formatPrice(price * item.quantity)}
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setItemToRemove(item)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <Card.Footer className="d-flex flex-wrap justify-content-between align-items-center gap-3 bg-white py-3">
          <Button as={Link} to="/laptops" variant="link" className="p-0 text-decoration-none">
            ← Tiếp tục mua sắm
          </Button>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span className="fs-6">
              Đã chọn: <strong className="text-primary">{selectedTotalQuantity}</strong> sản phẩm | Tổng thanh toán:{' '}
              <strong className="fs-4 text-danger ms-1">{formatPrice(selectedTotalPrice)}</strong>
            </span>
            <Button
              size="lg"
              variant="danger"
              disabled={selectedItems.length === 0 || invalidItems.length > 0}
              onClick={() => navigate('/checkout', { state: { selectedIds } })}
            >
              Tiến hành đặt hàng ({selectedItems.length})
            </Button>
          </div>
        </Card.Footer>
      </Card>

      <ConfirmModal
        show={Boolean(itemToRemove)}
        title="Xóa khỏi giỏ hàng"
        message={
          itemToRemove &&
          `Bạn có chắc muốn xóa "${itemToRemove.laptop?.name || itemToRemove.name}" khỏi giỏ hàng?`
        }
        confirmText="Xóa"
        onConfirm={confirmRemove}
        onCancel={() => setItemToRemove(null)}
      />
    </>
  );
}
