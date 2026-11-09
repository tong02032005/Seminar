import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

/** Layout cho các trang của khách tham quan */
export default function MainLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Bỏ qua tới nội dung</a>
      <Header />
      <main id="main" className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
