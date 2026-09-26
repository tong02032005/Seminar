import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bảo vệ route.
 * - Chưa đăng nhập → chuyển tới /login (kèm trang muốn vào để quay lại sau khi đăng nhập)
 * - Có `roles` mà user không thuộc → về trang chủ
 *
 * Khi nối FastAPI: có thể bổ sung kiểm tra hạn JWT (exp) hoặc gọi GET /api/users/me tại đây.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children ?? <Outlet />;
}
