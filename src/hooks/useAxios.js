import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient, { getErrorMessage, isCancel } from '../api/axiosClient';

/**
 * H1. Custom hook gom logic loading / data / error / AbortController.
 * Chuẩn đặc tả bài tập Assignment_code.md (Issue #13).
 *
 *   const { data, loading, error, refetch, setData } = useAxios(
 *     (signal) => laptopApi.getById(id, signal),
 *     [id]
 *   );
 */
export default function useAxios(fetcherOrConfig, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetcherRef = useRef(fetcherOrConfig);
  fetcherRef.current = fetcherOrConfig;

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let result;
        if (typeof fetcherRef.current === 'function') {
          result = await fetcherRef.current(controller.signal);
        } else {
          const res = await axiosClient({ ...fetcherRef.current, signal: controller.signal });
          result = res.data;
        }

        if (controller.signal.aborted) return;
        setData(result);
      } catch (err) {
        if (isCancel(err) || controller.signal.aborted) return;
        setError(getErrorMessage ? getErrorMessage(err) : (err.message || 'Có lỗi xảy ra'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, ...(Array.isArray(deps) ? deps : [])]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, loading, error, refetch, setData };
}