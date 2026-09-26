import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, Map, Users, MessageSquareText, Settings, Menu, X, LogOut, ExternalLink,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../../context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/animals', label: 'Động vật', icon: PawPrint },
  { to: '/admin/zones', label: 'Khu vực', icon: Map },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/reviews', label: 'Đánh giá', icon: MessageSquareText },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings },
];

/** Layout riêng cho Admin: sidebar cố định trên desktop, drawer trên mobile */
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => setDrawerOpen(false), [pathname]);

  const current = ADMIN_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${drawerOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__top">
          <Logo light to="/admin" />
          <button className="icon-btn admin-sidebar__close" onClick={() => setDrawerOpen(false)} aria-label="Đóng menu">
            <X size={22} />
          </button>
        </div>
        <nav aria-label="Menu quản trị">
          {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="admin-nav__link">
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-nav__link"><ExternalLink size={19} /> Xem trang khách</Link>
          <button className="admin-nav__link" onClick={logout}><LogOut size={19} /> Đăng xuất</button>
        </div>
      </aside>
      {drawerOpen && <div className="admin-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-btn admin-topbar__menu" onClick={() => setDrawerOpen(true)} aria-label="Mở menu">
            <Menu size={22} />
          </button>
          <h1>{current?.label ?? 'Quản trị'}</h1>
          <div className="admin-topbar__user">
            <span className="avatar-btn avatar-btn--static">{user?.fullName?.charAt(0) ?? 'A'}</span>
            <span className="admin-topbar__name">{user?.fullName}</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
