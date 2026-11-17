import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend gọi backend trực tiếp qua VITE_API_BASE_URL (backend đã bật CORS cho cổng 5173/4173).
// Chế độ static (npm run build:static): bản chỉ có phần khách xem, đọc dữ liệu đã xuất trong static-site/,
// đường dẫn tương đối ('./') để đặt ở bất kỳ thư mục nào (GitHub Pages, Netlify...). Kết quả: dist-static/
// VITE_API_BASE_URL để trống = gọi API cùng địa chỉ trang, Vite chuyển tiếp /api và /static sang backend.
// Nhờ vậy mở qua Tailscale (https://...ts.net:8443) vẫn đăng nhập được mà không cần thêm CORS cho backend.
const BACKEND_PROXY = { '/api': 'http://127.0.0.1:8000', '/static': 'http://127.0.0.1:8000' };

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1', allowedHosts: ['.ts.net'], proxy: BACKEND_PROXY },
  preview: { port: 4173, proxy: BACKEND_PROXY },
  ...(mode === 'static' && {
    base: './',
    publicDir: 'static-site',
    build: { outDir: 'dist-static' },
    define: { 'import.meta.env.VITE_STATIC': JSON.stringify('1') }, // bật IS_STATIC trong services/config.js
  }),
}));
