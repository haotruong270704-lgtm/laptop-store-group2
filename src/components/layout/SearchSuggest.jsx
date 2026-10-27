import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import { useDebounce } from '../../hooks';
import axiosClient from '../../api/axiosClient';
import { formatPrice } from '../../utils/format';

export default function SearchSuggest() {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const debouncedKeyword = useDebounce(keyword, 300);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Gọi API lấy danh sách gợi ý khi debouncedKeyword thay đổi
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedKeyword.trim()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axiosClient.get('/laptops', {
          params: {
            q: debouncedKeyword.trim(),
            _limit: 5 // Giới hạn 5 kết quả gợi ý
          }
        });
        setSuggestions(response.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Lỗi lấy danh sách gợi ý:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedKeyword]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (laptopId) => {
    setShowDropdown(false);
    setKeyword('');
    navigate(`/laptops/${laptopId}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setShowDropdown(false);
      navigate(`/laptops?search=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div ref={wrapperRef} className="position-relative w-100 me-2" style={{ maxWidth: '300px' }}>
      <Form onSubmit={handleSubmit}>
        <Form.Control
          type="search"
          placeholder="Tìm kiếm laptop..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => keyword.trim() && setShowDropdown(true)}
          size="sm"
        />
      </Form>

      {/* Dropdown hiển thị danh sách gợi ý */}
      {showDropdown && (keyword.trim() !== '') && (
        <ListGroup className="position-absolute w-100 mt-1 shadow z-3 bg-white border">
          {loading ? (
            <ListGroup.Item className="text-center py-2 text-muted">
              <Spinner animation="border" size="sm" className="me-2" />
              Đang tìm...
            </ListGroup.Item>
          ) : suggestions.length > 0 ? (
            suggestions.map((laptop) => (
              <ListGroup.Item
                key={laptop.id}
                action
                onClick={() => handleSelect(laptop.id)}
                className="d-flex justify-content-between align-items-center py-2 px-3 cursor-pointer"
              >
                <div className="text-truncate me-2" style={{ fontSize: '0.875rem' }}>
                  {laptop.name}
                </div>
                <span className="text-primary font-monospace fw-bold" style={{ fontSize: '0.75rem' }}>
                  {formatPrice ? formatPrice(laptop.price) : `${laptop.price}đ`}
                </span>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center py-2 text-muted" style={{ fontSize: '0.875rem' }}>
              Không tìm thấy sản phẩm
            </ListGroup.Item>
          )}
        </ListGroup>
      )}
    </div>
  );
}