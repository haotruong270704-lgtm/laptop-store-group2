import laptopApi from '../api/laptopApi';
import catalogApi from '../api/catalogApi';
import { isCancel } from '../api/axiosClient';
import useAxios from '../hooks/useAxios';
import usePageTitle from '../hooks/usePageTitle';
import LaptopGrid from '../components/laptop/LaptopGrid';
import ErrorAlert from '../components/common/ErrorAlert';
import dbData from '../../db.json';

const NEWEST_PARAMS = { _sort: 'createdAt', _order: 'desc', _limit: 8 };
const BESTSELLER_PARAMS = { _sort: 'sold', _order: 'desc', _limit: 4 };

/** C1. Gọi SONG SONG 4 request bằng Promise.all – thiếu 1 phần thì trang chủ không đủ dữ liệu */
async function loadParallel(signal) {
  const start = performance.now();
  try {
    const [newest, bestsellers, brands, categories] = await Promise.all([
      laptopApi.getAll(NEWEST_PARAMS, signal),
      laptopApi.getAll(BESTSELLER_PARAMS, signal),
      catalogApi.getBrands(signal),
      catalogApi.getCategories(signal),
    ]);
    return {
      newest: newest.items,
      bestsellers: bestsellers.items,
      brands,
      categories,
      parallelMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    if (isCancel(err)) throw err;
    const newestItems = [...dbData.laptops].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    const bestsellerItems = [...dbData.laptops].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4);
    return {
      newest: newestItems,
      bestsellers: bestsellerItems,
      brands: dbData.brands,
      categories: dbData.categories,
      parallelMs: Math.round(performance.now() - start),
    };
  }
}

export default function HomePage() {
  usePageTitle('Trang chủ');
  const { data, loading, error, refetch } = useAxios(loadParallel, []);

  if (error) return <ErrorAlert message={error} onRetry={refetch} />;

  return (
    <div className="py-2">
      <h4 className="fw-bold mb-3">🆕 Mới về</h4>
      <LaptopGrid laptops={data?.newest} loading={loading} skeletonCount={8} />
    </div>
  );
}
