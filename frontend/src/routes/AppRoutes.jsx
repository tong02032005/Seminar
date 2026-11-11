import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import Loader from '../components/common/Loader';
import { IS_STATIC } from '../services/config';

// Trang khách tham quan – không cần đăng nhập
import Home from '../pages/Home';
import Animals from '../pages/Animals';
import AnimalDetail from '../pages/AnimalDetail';
import Zones from '../pages/Zones';
import ZoneDetail from '../pages/ZoneDetail';
import MapPage from '../pages/Map';
import NotFound from '../pages/NotFound';

// Trang quản trị – tách riêng, tải lazy để khách không phải tải code quản trị
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminAnimals = lazy(() => import('../pages/admin/AdminAnimals'));
const AdminZones = lazy(() => import('../pages/admin/AdminZones'));
const AdminPois = lazy(() => import('../pages/admin/AdminPois'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const ChangePassword = lazy(() => import('../pages/admin/ChangePassword'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/animals" element={<Animals />} />
          <Route path="/animals/:id" element={<AnimalDetail />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/zones/:id" element={<ZoneDetail />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {!IS_STATIC && <Route path="/admin/login" element={<AdminLogin />} />}
        {!IS_STATIC && (
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="animals" element={<AdminAnimals />} />
          <Route path="zones" element={<AdminZones />} />
          <Route path="pois" element={<AdminPois />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="password" element={<ChangePassword />} />
        </Route>
        )}
      </Routes>
    </Suspense>
  );
}
