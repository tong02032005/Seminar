import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

const AuthContext = createContext(null);

/**
 * Quản lý phiên đăng nhập. Backend trả { access_token, user } khi đăng nhập/đăng ký;
 * khi mở lại app, token được kiểm tra qua GET /api/auth/me.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());

  useEffect(() => {
    if (!tokenStorage.getToken()) return;
    api.getCurrentUser()
      .then((fresh) => {
        tokenStorage.save(tokenStorage.getToken(), fresh, tokenStorage.isRemembered());
        setUser(fresh);
      })
      .catch((err) => {
        // Token hết hạn / tài khoản bị khóa hoặc xóa → đăng xuất; lỗi mạng thì giữ phiên
        if (err.status === 401 || err.status === 403) {
          tokenStorage.clear();
          setUser(null);
        }
      });
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    const { access_token, user: loggedIn } = await api.login({ email, password });
    tokenStorage.save(access_token, loggedIn, remember);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const { access_token, user: created } = await api.register(payload);
    tokenStorage.save(access_token, created, true);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    tokenStorage.save(tokenStorage.getToken(), updated, tokenStorage.isRemembered());
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>');
  return ctx;
};
