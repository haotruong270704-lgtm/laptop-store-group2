import { useEffect, useState } from 'react';
import { Container, Table, Button, Form, Card, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function AdminLaptopPage() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStockId, setUpdatingStockId] = useState(null);

  const fetchLaptops = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/laptops');
      setLaptops(res.data || []);
    } catch {
      setError('Không thể tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaptops();
  }, []);

  // Quick Edit Tồn kho qua PATCH /laptops/:id
  const handleStockBlur = async (id, newStock, currentStock) => {
    const val = Number(newStock);
    if (isNaN(val) || val === currentStock) return;

    setUpdatingStockId(id);
    try {
      await axiosClient.patch(`/laptops/${id}`, { stock: val });
      setLaptops((prev) =>
        prev.map((item) => (item.id === id ? { ...item, stock: val } : item))
      );
    } catch {
      alert('Cập nhật tồn kho thất bại!');
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Lọc sản phẩm theo từ khóa
  const filteredLaptops = laptops.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải danh sách laptop...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header trang Quản lý Laptop */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý Laptop</h2>
          <p className="text-muted mb-0">Danh sách sản phẩm trong hệ thống</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/orders" className="btn btn-outline-primary fw-semibold">
            📦 Quản lý Đơn hàng
          </Link>
          <Link to="/admin/laptops/create" className="btn btn-success fw-bold">
            + Thêm Laptop mới
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Ô Tìm kiếm nhanh */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3">
          <InputGroup style={{ maxWidth: '400px' }}>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                Xóa
              </Button>
            )}
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Bảng Danh sách Laptop */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th style={{ width: '80px' }}>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Thương hiệu</th>
                <th>Giá bán</th>
                <th style={{ width: '130px' }}>Tồn kho (Sửa nhanh)</th>
                <th className="text-end" style={{ width: '120px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredLaptops.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Không tìm thấy sản phẩm nào!
                  </td>
                </tr>
              ) : (
                filteredLaptops.map((laptop) => (
                  <tr key={laptop.id}>
                    <td className="fw-bold">#{laptop.id}</td>
                    <td>
                      <img
                        src={laptop.image || 'https://via.placeholder.com/60'}
                        alt={laptop.name}
                        style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                        className="rounded border"
                      />
                    </td>
                    <td>
                      <div className="fw-semibold">{laptop.name}</div>
                      <small className="text-muted">{laptop.cpu || ''}</small>
                    </td>
                    <td>{laptop.brandName}</td>
                    <td className="text-danger fw-bold">{formatMoney(laptop.price)}</td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="0"
                        defaultValue={laptop.stock}
                        disabled={updatingStockId === laptop.id}
                        onBlur={(e) => handleStockBlur(laptop.id, e.target.value, laptop.stock)}
                      />
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/admin/laptops/edit/${laptop.id}`}
                        className="btn btn-outline-warning btn-sm fw-semibold"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}