import { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function AdminLaptopFormPage() {
  const { id } = useParams(); // Nếu có id -> Edit, không có id -> Create
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    price: '',
    stock: '',
    image: '',
    cpu: '',
    ram: '',
    ssd: '',
    screen: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);

  // Nếu là Edit, fetch dữ liệu laptop hiện tại
  useEffect(() => {
    if (!isEdit) return;

    const fetchLaptopDetail = async () => {
      try {
        const res = await axiosClient.get(`/laptops/${id}`);
        setFormData({
          name: res.data.name || '',
          brandName: res.data.brandName || '',
          price: res.data.price || '',
          stock: res.data.stock ?? 10,
          image: res.data.image || '',
          cpu: res.data.cpu || '',
          ram: res.data.ram || '',
          ssd: res.data.ssd || '',
          screen: res.data.screen || '',
          description: res.data.description || '',
        });
      } catch {
        setError('Không thể lấy thông tin sản phẩm!');
      } finally {
        setFetching(false);
      }
    };

    fetchLaptopDetail();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    };

    try {
      if (isEdit) {
        await axiosClient.put(`/laptops/${id}`, payload);
      } else {
        await axiosClient.post('/laptops', payload);
      }
      navigate('/admin/laptops');
    } catch {
      setError(isEdit ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải thông tin sản phẩm...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{isEdit ? 'Chỉnh sửa Laptop' : 'Thêm Laptop Mới'}</h2>
          <p className="text-muted mb-0">
            {isEdit ? `Cập nhật thông tin cho sản phẩm #${id}` : 'Nhập chi tiết sản phẩm mới vào hệ thống'}
          </p>
        </div>
        <Link to="/admin/laptops" className="btn btn-outline-secondary">
          ← Quay lại danh sách
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Tên sản phẩm *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="VD: Laptop Asus Zenbook 14"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Thương hiệu *</Form.Label>
                  <Form.Control
                    type="text"
                    name="brandName"
                    placeholder="VD: ASUS, Dell, Apple"
                    value={formData.brandName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Giá bán (VNĐ) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    min="0"
                    placeholder="20000000"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Số lượng tồn kho *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    min="0"
                    placeholder="10"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Đường dẫn Hình ảnh (URL)</Form.Label>
                  <Form.Control
                    type="url"
                    name="image"
                    placeholder="https://example.com/laptop.jpg"
                    value={formData.image}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">CPU</Form.Label>
                  <Form.Control
                    type="text"
                    name="cpu"
                    placeholder="Intel Core i7"
                    value={formData.cpu}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">RAM</Form.Label>
                  <Form.Control
                    type="text"
                    name="ram"
                    placeholder="16GB"
                    value={formData.ram}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Ổ cứng (SSD)</Form.Label>
                  <Form.Control
                    type="text"
                    name="ssd"
                    placeholder="512GB"
                    value={formData.ssd}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-semibold">Màn hình</Form.Label>
                  <Form.Control
                    type="text"
                    name="screen"
                    placeholder='14" FHD'
                    value={formData.screen}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col md={12} className="mb-4">
                <Form.Group>
                  <Form.Label className="fw-semibold">Mô tả sản phẩm</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    placeholder="Nhập mô tả chi tiết sản phẩm..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Link to="/admin/laptops" className="btn btn-light px-4">
                Hủy
              </Link>
              <Button type="submit" variant="primary" className="fw-bold px-4" disabled={loading}>
                {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}