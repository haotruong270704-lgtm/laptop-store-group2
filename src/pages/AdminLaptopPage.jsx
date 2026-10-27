import { useEffect, useState } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatPrice } from '../utils/format';

export default function AdminLaptopPage() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchLaptops = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/laptops');
      setLaptops(res.data);
    } catch {
      setError('Không thể tải danh sách sản phẩm admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaptops();
  }, []);

  // Quick Edit: Cập nhật tồn kho nhanh khi rời ô input (onBlur)
  const handleQuickStockUpdate = async (id, newStock) => {
    const parsedStock = Number(newStock);
    if (isNaN(parsedStock) || parsedStock < 0) return;

    setUpdatingId(id);
    try {
      await axiosClient.patch(`/laptops/${id}`, { stock: parsedStock });
      setLaptops((prev) =>
        prev.map((item) => (item.id === id ? { ...item, stock: parsedStock } : item))
      );
    } catch {
      alert('Cập nhật số lượng thất bại!');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLaptops = laptops.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải dữ liệu quản trị...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý Laptop</h2>
          <p className="text-muted mb-0">Danh sách và chỉnh sửa thông tin sản phẩm trong hệ thống</p>
        </div>
        <Link to="/admin/laptops/create" className="btn btn-success fw-bold px-3">
          + Thêm laptop mới
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên laptop..."
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

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '80px' }}>Hình</th>
                <th>Tên sản phẩm</th>
                <th>Thương hiệu</th>
                <th>Giá bán</th>
                <th style={{ width: '140px' }}>Tồn kho (Quick Edit)</th>
                <th className="text-end" style={{ width: '150px' }}>Thao tác</th>
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
                filteredLaptops.map((laptop, index) => (
                  <tr key={laptop.id || index}>
                    <td>{laptop.id}</td>
                    <td>
                      <img
                        src={laptop.image || 'https://via.placeholder.com/50'}
                        alt={laptop.name}
                        style={{ width: '50px', height: '40px', objectFit: 'contain' }}
                      />
                    </td>
                    <td className="fw-semibold">{laptop.name}</td>
                    <td>
                      <Badge bg="info">{laptop.brandName || 'N/A'}</Badge>
                    </td>
                    <td className="text-danger fw-bold">
                      {formatPrice ? formatPrice(laptop.price) : `${laptop.price} VNĐ`}
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="0"
                        defaultValue={laptop.stock ?? 10}
                        disabled={updatingId === laptop.id}
                        onBlur={(e) => handleQuickStockUpdate(laptop.id, e.target.value)}
                        style={{ width: '90px' }}
                      />
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/admin/laptops/edit/${laptop.id}`}
                        className="btn btn-outline-primary btn-sm me-2"
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