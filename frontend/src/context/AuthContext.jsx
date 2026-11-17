import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

const AuthContext = createContext(null);

/**
 * Phiên đăng nhập của ADMIN (khách không đăng nhập).
 * Mở lại app: kiểm tra token qua GET /api/auth/me. Token hết hạn hoặc cấp trước lần đổi mật khẩu
 * → httpClient phát sự kiện 'auth:expired' → đăng xuất, quay về form đăng nhập (UC05 E4).
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStorage.getToken()));

  useEffect(() => {
    if (!tokenStorage.getToken()) return;
    api.getCurrentAdmin()
      .then(setAdmin)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setAdmin(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { token } = await api.login({ email, password });
    tokenStorage.save(token);
    const me = await api.getCurrentAdmin();
    setAdmin(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    api.logout().catch(() => {}); // server chỉ trả 204; token được xóa ở trình duyệt
    tokenStorage.clear();
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, checking, login, logout }), [admin, checking, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>');
  return ctx;
};
