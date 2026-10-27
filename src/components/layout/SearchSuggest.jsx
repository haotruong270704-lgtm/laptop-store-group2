import { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

/** 🧩 Bản tạm (#14) – A thay toàn bộ ở #19 (thêm gợi ý + debounce + hủy request) */
export default function SearchSuggest({ onNavigate }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    navigate(`/laptops?q=${encodeURIComponent(q)}`);
    setKeyword('');
    onNavigate?.();
  };

  return (
    <Form className="my-2 my-lg-0" onSubmit={handleSubmit} role="search">
      <InputGroup>
        <Form.Control
          type="search"
          placeholder="Tìm laptop..."
          aria-label="Tìm laptop"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button type="submit" variant="warning">
          Tìm
        </Button>
      </InputGroup>
    </Form>
  );
}
