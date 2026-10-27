import { useEffect, useRef, useState } from 'react';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import laptopApi from '../../api/laptopApi';
import { isCancel } from '../../api/axiosClient';
import useDebounce from '../../hooks/useDebounce';
import { formatPrice, getSellingPrice } from '../../utils/format';

/**
 * D3. Ô tìm kiếm gợi ý trên Navbar (#19)
 * - Ngừng gõ 400ms mới gọi GET /laptops?q=...&_limit=5
 * - Gõ tiếp → request đang chạy bị hủy (AbortController)
 * - Đóng dropdown khi nhấn Escape hoặc click bên ngoài
 */
export default function SearchSuggest({ onNavigate }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Debounce 400ms theo đúng đặc tả D3 / kịch bản 5
  const debouncedKeyword = useDebounce(keyword.trim(), 400);

  // Hủy request khi gõ liên tục với AbortController
  useEffect(() => {
    if (!debouncedKeyword) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const search = async () => {
      setLoading(true);
      try {
        const { items } = await laptopApi.getAll(
          { q: debouncedKeyword, _limit: 5 },
          controller.signal
        );
        setSuggestions(items || []);
      } catch (err) {
        if (isCancel(err)) return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    search();
    return () => controller.abort();
  }, [debouncedKeyword]);

  // Click outside để đóng menu gợi ý
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = () => {
    setOpen(false);
    setKeyword('');
    setSuggestions([]);
    onNavigate?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    navigate(`/laptops?q=${encodeURIComponent(q)}`);
    close();
  };

  const goToDetail = (id) => {
    navigate(`/laptops/${id}`);
    close();
  };

  const showDropdown = open && keyword.trim() !== '';

  return (
    <div ref={wrapperRef} className="position-relative w-100">
      <Form onSubmit={handleSubmit} role="search">
        <Form.Control
          type="search"
          placeholder="Tìm laptop..."
          aria-label="Tìm laptop"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (keyword.trim()) setOpen(true);
          }}
          onKeyDown={(e) => {
            // Xử lý phím Esc để đóng menu gợi ý
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
      </Form>

      {/* Dropdown danh sách gợi ý */}
      {showDropdown && (
        <ListGroup className="position-absolute w-100 shadow search-suggest-list bg-white border">
          {loading && (
            <ListGroup.Item className="text-secondary small py-2 text-center">
              <Spinner size="sm" className="me-2" />
              Đang tìm...
            </ListGroup.Item>
          )}

          {!loading && debouncedKeyword && suggestions.length === 0 && (
            <ListGroup.Item className="text-secondary small py-2 text-center">
              Không tìm thấy sản phẩm
            </ListGroup.Item>
          )}

          {!loading &&
            suggestions.map((laptop) => (
              <ListGroup.Item
                key={laptop.id}
                action
                onMouseDown={(e) => {
                  e.preventDefault();
                  goToDetail(laptop.id);
                }}
                className="d-flex justify-content-between align-items-center py-2 px-3 gap-2"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-truncate text-dark" style={{ fontSize: '0.9rem' }}>
                  {laptop.name}
                </span>
                <span className="text-primary font-monospace fw-bold text-nowrap" style={{ fontSize: '0.85rem' }}>
                  {formatPrice(getSellingPrice(laptop))}
                </span>
              </ListGroup.Item>
            ))}
        </ListGroup>
      )}
    </div>
  );
}
