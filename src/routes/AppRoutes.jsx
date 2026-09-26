import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import Loader from '../components/common/Loader';

// Trang khách tham quan
import Home from '../pages/Home';
import Animals from '../pages/Animals';
import AnimalDetail from '../pages/AnimalDetail';
import Zones from '../pages/Zones';
import ZoneDetail from '../pages/ZoneDetail';
import MapPage from '../pages/Map';
import Tour from '../pages/Tour';
import Favorites from '../pages/Favorites';
import QRScanner from '../pages/QRScanner';
import Chat from '../pages/Chat';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

// Trang Admin – tải lazy để khách không phải tải code quản trị
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminAnimals = lazy(() => import('../pages/admin/AdminAnimals'));
const AdminZones = lazy(() => import('../pages/admin/AdminZones'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <Routes>
        {/* ---------- Khách tham quan ---------- */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/animals" element={<Animals />} />
          <Route path="/animals/:id" element={<AnimalDetail />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/zones/:id" element={<ZoneDetail />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/qr" element={<QRScanner />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ---------- Admin (yêu cầu role admin) ---------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="animals" element={<AdminAnimals />} />
          <Route path="zones" element={<AdminZones />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
