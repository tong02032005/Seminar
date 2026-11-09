/**
 * Cấu hình kết nối backend FastAPI (thư mục backend/).
 * Đổi VITE_API_BASE_URL trong file .env nếu backend chạy ở địa chỉ khác (vd https://127.0.0.1:8000).
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};

/** Backend trả đường dẫn file dạng "/static/..." → ghép địa chỉ backend; URL đầy đủ (https://...) giữ nguyên */
export const mediaUrl = (path) => (path && path.startsWith('/') ? `${API_CONFIG.BASE_URL}${path}` : path || null);
