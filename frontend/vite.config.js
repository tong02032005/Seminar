import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend gọi backend trực tiếp qua VITE_API_BASE_URL (backend đã bật CORS cho cổng 5173/4173)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
});
