// Lưu JWT và thông tin user. Tách riêng để sau này dễ đổi sang cookie httpOnly.
const TOKEN_KEY = 'zooguide_token';
const USER_KEY = 'zooguide_user';

export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  /** true nếu phiên được lưu ở localStorage (đã chọn "Ghi nhớ đăng nhập") */
  isRemembered: () => Boolean(localStorage.getItem(TOKEN_KEY)),
  save: (token, user, remember = true) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    [localStorage, sessionStorage].forEach((s) => {
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
    });
  },
};
