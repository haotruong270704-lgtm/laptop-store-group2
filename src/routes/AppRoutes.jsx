import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import LaptopListPage from '../pages/LaptopListPage';
import LaptopDetailPage from '../pages/LaptopDetailPage';
import NotFoundPage from '../pages/NotFoundPage'; // hoặc 404 page

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="laptops" element={<LaptopListPage />} />
        
        {/* Khai báo route chi tiết laptop ở đây */}
        <Route path="laptops/:id" element={<LaptopDetailPage />} />
      </Route>

      {/* Wildcard Route 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}