import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend gọi backend trực tiếp qua VITE_API_BASE_URL (backend đã bật CORS cho cổng 5173/4173).
// Chế độ static (npm run build:static): bản chỉ có phần khách xem, đọc dữ liệu đã xuất trong static-site/,
// đường dẫn tương đối ('./') để đặt ở bất kỳ thư mục nào (GitHub Pages, Netlify...). Kết quả: dist-static/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1', allowedHosts: ['.ts.net'] },
  preview: { port: 4173 },
  ...(mode === 'static' && {
    base: './',
    publicDir: 'static-site',
    build: { outDir: 'dist-static' },
    define: { 'import.meta.env.VITE_STATIC': JSON.stringify('1') }, // bật IS_STATIC trong services/config.js
  }),
}));
