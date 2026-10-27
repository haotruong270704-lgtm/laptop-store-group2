import { useState } from 'react';
import { Button, Col, Form, Image, Row, Spinner } from 'react-bootstrap';
import { handleImageError } from '../../utils/image';

export const RAM_CHOICES = [4, 8, 16, 32, 64];
export const STORAGE_CHOICES = [256, 512, 1024, 2048];

export const EMPTY_LAPTOP = {
  name: '',
  brandId: '',
  categoryId: '',
  price: '',
  salePrice: '',
  cpu: '',
  ram: '',
  storage: '',
  screen: '',
  gpu: '',
  weight: '',
  stock: '',
  image: '',
  description: '',
};

/** Laptop từ API → giá trị form (mọi trường là chuỗi) */
export const toFormValues = (laptop) =>
  Object.fromEntries(
    Object.keys(EMPTY_LAPTOP).map((key) => [
      key,
      laptop[key] === null || laptop[key] === undefined ? '' : String(laptop[key]),
    ])
  );

/** Giá trị form → dữ liệu gửi API */
export const toPayload = (values) => ({
  name: values.name.trim(),
  brandId: Number(values.brandId),
  categoryId: Number(values.categoryId),
  price: Number(values.price),
  salePrice: values.salePrice === '' ? null : Number(values.salePrice),
  cpu: values.cpu.trim(),
  ram: Number(values.ram),
  storage: Number(values.storage),
  screen: values.screen.trim(),
  gpu: values.gpu.trim(),
  weight: values.weight === '' ? null : Number(values.weight),
  stock: Number(values.stock),
  image: values.image.trim(),
  description: values.description.trim(),
});

const isPositiveInt = (v) => v !== '' && Number.isInteger(Number(v)) && Number(v) > 0;

/** G3 + BR-10. Kiểm tra hợp lệ TẤT CẢ các trường */
export function validateLaptop(values) {
  const errors = {};
  const name = values.name.trim();

  // 1. Tên sản phẩm
  if (!name) {
    errors.name = 'Vui lòng nhập tên sản phẩm';
  } else if (name.length < 5 || name.length > 100) {
    errors.name = 'Tên sản phẩm phải từ 5 đến 100 ký tự';
  }

  // 2. Thương hiệu
  if (!values.brandId) {
    errors.brandId = 'Vui lòng chọn thương hiệu';
  }

  // 3. Phân loại
  if (!values.categoryId) {
    errors.categoryId = 'Vui lòng chọn phân loại laptop';
  }

  // 4. Giá bán
  if (!values.price) {
    errors.price = 'Vui lòng nhập giá bán';
  } else if (!isPositiveInt(values.price)) {
    errors.price = 'Giá bán phải là số nguyên dương lớn hơn 0';
  }

  // 5. Giá khuyến mãi (nếu có)
  if (values.salePrice !== '') {
    if (!isPositiveInt(values.salePrice)) {
      errors.salePrice = 'Giá khuyến mãi phải là số nguyên dương lớn hơn 0';
    } else if (!errors.price && Number(values.salePrice) >= Number(values.price)) {
      errors.salePrice = 'Giá khuyến mãi phải nhỏ hơn giá gốc';
    }
  }

  // 6. Số lượng tồn kho
  if (values.stock === '') {
    errors.stock = 'Vui lòng nhập số lượng tồn kho';
  } else if (!Number.isInteger(Number(values.stock)) || Number(values.stock) < 0) {
    errors.stock = 'Số lượng tồn kho phải là số nguyên ≥ 0';
  }

  // 7. CPU
  if (!values.cpu?.trim()) {
    errors.cpu = 'Vui lòng nhập thông tin CPU';
  }

  // 8. GPU (Card đồ họa)
  if (!values.gpu?.trim()) {
    errors.gpu = 'Vui lòng nhập thông tin Card đồ họa (GPU)';
  }

  // 9. RAM
  if (!values.ram || !RAM_CHOICES.includes(Number(values.ram))) {
    errors.ram = 'Vui lòng chọn dung lượng RAM hợp lệ';
  }

  // 10. Ổ cứng (SSD)
  if (!values.storage || !STORAGE_CHOICES.includes(Number(values.storage))) {
    errors.storage = 'Vui lòng chọn dung lượng ổ cứng hợp lệ';
  }

  // 11. Màn hình
  if (!values.screen?.trim()) {
    errors.screen = 'Vui lòng nhập kích thước và thông số màn hình';
  }

  // 12. Cân nặng
  if (values.weight === '') {
    errors.weight = 'Vui lòng nhập cân nặng của máy';
  } else if (isNaN(Number(values.weight)) || Number(values.weight) <= 0) {
    errors.weight = 'Cân nặng phải là số dương lớn hơn 0';
  }

  // 13. Đường dẫn hình ảnh
  if (!values.image?.trim()) {
    errors.image = 'Vui lòng nhập đường dẫn hình ảnh';
  } else if (!values.image.trim().startsWith('http://') && !values.image.trim().startsWith('https://')) {
    errors.image = 'Link ảnh phải là URL hợp lệ (bắt đầu bằng http:// hoặc https://)';
  }

  // 14. Mô tả sản phẩm
  if (!values.description?.trim()) {
    errors.description = 'Vui lòng nhập mô tả chi tiết sản phẩm';
  } else if (values.description.trim().length < 10) {
    errors.description = 'Mô tả sản phẩm phải có ít nhất 10 ký tự';
  }

  return errors;
}

/**
 * Form thêm mới và chỉnh sửa laptop với kiểm tra hợp lệ toàn diện
 */
export default function LaptopForm({
  initialValues = EMPTY_LAPTOP,
  brands = [],
  categories = [],
  onSubmit,
  submitting,
  submitText = 'Lưu thông tin',
}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validateLaptop(values);
  const showError = (field) => (touched[field] || submitted) && errors[field];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSubmit(toPayload(values));
  };

  const renderField = (name, label, props = {}) => (
    <Form.Group className="mb-3" controlId={`laptop-${name}`}>
      <Form.Label className="fw-semibold">{label}</Form.Label>
      <Form.Control
        name={name}
        value={values[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        isInvalid={Boolean(showError(name))}
        {...props}
      />
      <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
    </Form.Group>
  );

  const renderSelect = (name, label, options, placeholder) => (
    <Form.Group className="mb-3" controlId={`laptop-${name}`}>
      <Form.Label className="fw-semibold">{label}</Form.Label>
      <Form.Select
        name={name}
        value={values[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        isInvalid={Boolean(showError(name))}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
    </Form.Group>
  );

  const isImageValid = values.image?.trim().startsWith('http');

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Row>
        <Col lg={8}>
          {renderField('name', 'Tên sản phẩm *', {
            placeholder: 'VD: Laptop Asus Zenbook 14 OLED UX3405',
          })}

          <Row>
            <Col md={6}>
              {renderSelect(
                'brandId',
                'Thương hiệu *',
                brands.map((b) => ({ value: b.id, label: b.name })),
                '-- Chọn thương hiệu --'
              )}
            </Col>
            <Col md={6}>
              {renderSelect(
                'categoryId',
                'Phân loại *',
                categories.map((c) => ({ value: c.id, label: c.name })),
                '-- Chọn phân loại --'
              )}
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              {renderField('price', 'Giá bán (VNĐ) *', {
                type: 'number',
                min: 1,
                step: 1000,
                placeholder: '20000000',
              })}
            </Col>
            <Col md={4}>
              {renderField('salePrice', 'Giá khuyến mãi (VNĐ)', {
                type: 'number',
                min: 1,
                step: 1000,
                placeholder: 'Để trống nếu không giảm giá',
              })}
            </Col>
            <Col md={4}>
              {renderField('stock', 'Số lượng tồn kho *', {
                type: 'number',
                min: 0,
                step: 1,
                placeholder: '10',
              })}
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              {renderField('cpu', 'CPU *', {
                placeholder: 'VD: Intel Core i7-13700H / Apple M3',
              })}
            </Col>
            <Col md={6}>
              {renderField('gpu', 'Card đồ họa (GPU) *', {
                placeholder: 'VD: NVIDIA RTX 4060 8GB / Intel Arc Graphics',
              })}
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              {renderSelect(
                'ram',
                'Dung lượng RAM *',
                RAM_CHOICES.map((r) => ({ value: r, label: `${r} GB` })),
                '-- Chọn RAM --'
              )}
            </Col>
            <Col md={4}>
              {renderSelect(
                'storage',
                'Ổ cứng SSD *',
                STORAGE_CHOICES.map((s) => ({
                  value: s,
                  label: s >= 1024 ? `${s / 1024} TB` : `${s} GB`,
                })),
                '-- Chọn SSD --'
              )}
            </Col>
            <Col md={4}>
              {renderField('weight', 'Cân nặng (kg) *', {
                type: 'number',
                min: 0.1,
                step: 0.01,
                placeholder: 'VD: 1.45',
              })}
            </Col>
          </Row>

          {renderField('screen', 'Màn hình *', {
            placeholder: 'VD: 14 inch 2.8K OLED 120Hz',
          })}

          {renderField('description', 'Mô tả chi tiết sản phẩm *', {
            as: 'textarea',
            rows: 4,
            placeholder: 'Nhập mô tả chi tiết tính năng, thời lượng pin, thiết kế sản phẩm...',
          })}
        </Col>

        <Col lg={4}>
          {renderField('image', 'Đường dẫn Hình ảnh (URL) *', {
            placeholder: 'https://example.com/laptop.jpg',
          })}
          <div className="border rounded-3 p-3 text-center bg-light shadow-sm">
            <div className="fw-semibold text-secondary small mb-2">Xem trước hình ảnh</div>
            {isImageValid ? (
              <Image
                src={values.image}
                alt="Xem trước hình ảnh"
                fluid
                rounded
                style={{ maxHeight: 220, objectFit: 'contain' }}
                onError={handleImageError}
              />
            ) : (
              <div className="py-5 text-muted small">
                Nhập link ảnh hợp lệ để xem trước
              </div>
            )}
          </div>
        </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <Button type="submit" variant="primary" className="fw-bold px-4" disabled={submitting}>
          {submitting && <Spinner size="sm" className="me-2" animation="border" />}
          {submitText}
        </Button>
      </div>
    </Form>
  );
}
