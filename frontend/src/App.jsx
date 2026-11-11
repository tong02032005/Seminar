import { BrowserRouter, HashRouter } from 'react-router-dom';
import { IS_STATIC } from './services/config';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import ScrollToTop from './components/common/ScrollToTop';
import AppRoutes from './routes/AppRoutes';

// Bản tĩnh dùng HashRouter (#/animals) để chạy được trên GitHub Pages/Netlify mà không cần cấu hình server
const Router = IS_STATIC ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </Router>
  );
}
