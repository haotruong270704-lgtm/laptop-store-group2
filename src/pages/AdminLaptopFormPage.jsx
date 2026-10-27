import { useEffect, useState } from 'react';
import { Alert, Breadcrumb, Card, Container, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import laptopApi from '../api/laptopApi';
import catalogApi from '../api/catalogApi';
import { getErrorMessage } from '../api/axiosClient';
import usePageTitle from '../hooks/usePageTitle';
import LaptopForm, { EMPTY_LAPTOP, toFormValues } from '../components/laptop/LaptopForm';
import NotFoundPage from './NotFoundPage';
import dbData from '../../db.json';

export default function AdminLaptopFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  if (id !== undefined && !/^\d+$/.test(id)) return <NotFoundPage />;

  return <LaptopFormScreen key={id ?? 'new'} id={id} isEdit={isEdit} />;
}

function LaptopFormScreen({ id, isEdit }) {
  const navigate = useNavigate();
  usePageTitle(isEdit ? `Chỉnh sửa Laptop #${id}` : 'Thêm Laptop Mới');

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialValues, setInitialValues] = useState(EMPTY_LAPTOP);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadFormData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [brandsRes, categoriesRes, laptopRes] = await Promise.allSettled([
          catalogApi.getBrands(),
          catalogApi.getCategories(),
          isEdit ? laptopApi.getById(id) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        // Xử lý danh sách Brands
        if (brandsRes.status === 'fulfilled' && brandsRes.value?.length > 0) {
          setBrands(brandsRes.value);
        } else {
          setBrands(dbData.brands || []);
        }

        // Xử lý danh sách Categories
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.length > 0) {
          setCategories(categoriesRes.value);
        } else {
          setCategories(dbData.categories || []);
        }

        // Nếu là Edit, nạp dữ liệu laptop cũ
        if (isEdit) {
          let laptopData = null;
          if (laptopRes.status === 'fulfilled' && laptopRes.value) {
            laptopData = laptopRes.value;
          } else {
            laptopData = dbData.laptops.find((l) => String(l.id) === String(id));
          }

          if (laptopData) {
            setInitialValues(toFormValues(laptopData));
          } else {
            setError('Không tìm thấy thông tin sản phẩm cần chỉnh sửa!');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage ? getErrorMessage(err) : 'Lỗi khi tải dữ liệu biểu mẫu');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadFormData();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await laptopApi.update(id, { ...payload, id: Number(id) });
      } else {
        await laptopApi.create({
          ...payload,
          sold: 0,
          rating: 5,
          createdAt: new Date().toISOString(),
        });
      }
      navigate('/admin/laptops');
    } catch (err) {
      setError(
        getErrorMessage
          ? getErrorMessage(err)
          : isEdit
          ? 'Cập nhật sản phẩm thất bại!'
          : 'Thêm mới sản phẩm thất bại!'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Đang tải biểu mẫu thông tin laptop...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '960px' }}>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/admin/laptops' }}>
          Quản lý Laptop
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{isEdit ? `Chỉnh sửa #${id}` : 'Thêm mới'}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{isEdit ? 'Chỉnh sửa Laptop' : 'Thêm Laptop Mới'}</h2>
          <p className="text-muted mb-0">
            {isEdit
              ? `Cập nhật thông tin chi tiết cho sản phẩm #${id}`
              : 'Nhập đầy đủ và hợp lệ các trường thông tin sản phẩm'}
          </p>
        </div>
        <Link to="/admin/laptops" className="btn btn-outline-secondary">
          ← Quay lại danh sách
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <LaptopForm
            initialValues={initialValues}
            brands={brands}
            categories={categories}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitText={isEdit ? 'Cập nhật sản phẩm' : 'Tạo mới sản phẩm'}
          />
        </Card.Body>
      </Card>
    </Container>
  );
}