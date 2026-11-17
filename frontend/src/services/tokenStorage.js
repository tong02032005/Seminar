// Lưu JWT của admin trên trình duyệt. Khách không cần token.
const TOKEN_KEY = 'zooguide_admin_token';

export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  save: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};
