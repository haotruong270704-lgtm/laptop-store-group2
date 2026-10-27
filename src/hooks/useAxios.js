import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook tự động gọi API và quản lý state (loading, error, data)
 * @param {Object} config Cấu hình request (url, method, params, data, ...)
 * @param {boolean} executeOnMount Có tự động chạy khi component mount hay không (default: true)
 */
export const useAxios = (config, executeOnMount = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(executeOnMount);
  const [error, setError] = useState(null);

  // Lưu config vào ref để tránh re-render lặp vô hạn
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const fetchData = useCallback(async (customConfig = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedConfig = { ...configRef.current, ...customConfig };
      const response = await axiosClient(mergedConfig);
      setData(response.data);
      return { responseData: response.data, err: null };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Có lỗi xảy ra!';
      setError(errorMessage);
      return { responseData: null, err: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (executeOnMount) {
      let isSubscribed = true;

      const runFetch = async () => {
        const result = await fetchData();
        if (!isSubscribed) return;
        return result;
      };

      runFetch();

      return () => {
        isSubscribed = false;
      };
    }
  }, [fetchData, executeOnMount]);

  return { data, loading, error, refetch: fetchData };
};

export default useAxios;