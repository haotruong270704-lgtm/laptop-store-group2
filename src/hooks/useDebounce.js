import { useState, useEffect } from 'react';

/**
 * Custom hook hoãn cập nhật giá trị theo khoảng thời gian delay
 * @param {any} value - Giá trị cần debounce (từ khóa tìm kiếm, bộ lọc...)
 * @param {number} delay - Thời gian hoãn (tính bằng ms), mặc định 500ms
 * @returns {any} debouncedValue
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timer nếu value hoặc delay thay đổi trước khi timeout hoàn tất
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;