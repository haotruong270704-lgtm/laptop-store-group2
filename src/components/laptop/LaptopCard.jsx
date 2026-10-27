import { Badge, Button, Card, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Price from '../common/Price';
import StarRating from '../common/StarRating';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { handleImageError } from '../../utils/image';
import { getLaptopImage } from '../../utils/laptopImages';
import { useState } from 'react';

const storageLabel = (gb) => (gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`);

/** E2. Thẻ sản phẩm */
export default function LaptopCard({ laptop }) {
  const { addToCart } = useCart();
  const { showToast } = useToast?.() || {};
  const [adding, setAdding] = useState(false);

  const outOfStock = (laptop.stock ?? 0) <= 0; // BR-01
  const detailUrl = `/laptops/${laptop.id}`;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock || adding) return;

    setAdding(true);
    try {
      await addToCart(laptop, 1);
      if (showToast) {
        showToast(`Đã thêm "${laptop.name}" vào giỏ hàng!`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast(err?.message || 'Không thể thêm vào giỏ hàng!', 'danger');
      } else {
        alert(err?.message || 'Không thể thêm vào giỏ hàng!');
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="h-100 shadow-sm laptop-card">
      <Link to={detailUrl} className="position-relative">
        <Card.Img
          variant="top"
          src={getLaptopImage(laptop)}
          alt={laptop.name}
          className="laptop-card-img"
          onError={handleImageError}
        />
        {outOfStock && (
          <Badge bg="secondary" className="position-absolute top-0 start-0 m-2">
            Hết hàng
          </Badge>
        )}
      </Link>
      <Card.Body className="d-flex flex-column">
        <Card.Title as="h6" className="line-clamp-2" title={laptop.name}>
          <Link to={detailUrl} className="text-decoration-none text-body">
            {laptop.name}
          </Link>
        </Card.Title>
        <div className="d-flex flex-wrap gap-1 mb-2">
          {laptop.cpu && (
            <Badge bg="light" text="dark" className="border">
              {laptop.cpu}
            </Badge>
          )}
          {laptop.ram && (
            <Badge bg="light" text="dark" className="border">
              RAM {laptop.ram}GB
            </Badge>
          )}
          {(laptop.storage || laptop.ssd) && (
            <Badge bg="light" text="dark" className="border">
              SSD {storageLabel(laptop.storage || laptop.ssd)}
            </Badge>
          )}
        </div>
        <StarRating value={laptop.rating || 5} />
        <div className="mt-auto pt-2">
          <Price laptop={laptop} />
          <Button
            variant={outOfStock ? 'secondary' : 'primary'}
            className="w-100 mt-2"
            disabled={outOfStock || adding}
            onClick={handleAddToCart}
          >
            {adding && <Spinner size="sm" className="me-2" animation="border" />}
            {outOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}