/**
 * Cấu hình kết nối backend (thư mục backend/, FastAPI).
 * Đổi VITE_API_BASE_URL trong file .env nếu backend chạy ở địa chỉ khác.
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};
