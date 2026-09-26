import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Search, Globe, Menu, X, User, LogOut, LayoutDashboard, ScanLine } from 'lucide-react';
import Logo from './Logo';
import SearchOverlay from './SearchOverlay';
import { MAIN_NAV } from './navLinks';
import { useScrolled } from '../../hooks/useScrolled';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { LANGUAGES } from '../../utils/translations';

export default function Header() {
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const { user, isAdmin, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { favoriteIds } = useFavorites();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Trang chủ: header trong suốt trên ảnh hero, đặc lại khi cuộn
  const transparent = pathname === '/' && !scrolled && !menuOpen;

  // Đóng menu khi đổi trang
  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
    setLangOpen(false);
  }, [pathname]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className={`site-header ${transparent ? 'is-transparent' : 'is-solid'} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <Logo light={transparent} />

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Menu chính">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="main-nav__link">
              {t(item.key)}
              {item.key === 'favorites' && favoriteIds.length > 0 && (
                <span className="nav-count">{favoriteIds.length}</span>
              )}
            </NavLink>
          ))}
          <NavLink to="/qr" className="main-nav__link main-nav__link--mobile-only">
            <ScanLine size={18} /> {t('qr')}
          </NavLink>
          {!user && (
            <Link to="/login" className="btn btn--primary main-nav__login">{t('login')}</Link>
          )}
        </nav>

        <div className="header-actions" ref={dropdownRef}>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Tìm kiếm">
            <Search size={20} />
          </button>

          <div className="dropdown">
            <button
              className="icon-btn"
              onClick={() => { setLangOpen((v) => !v); setUserOpen(false); }}
              aria-label="Chọn ngôn ngữ"
              aria-expanded={langOpen}
            >
              <Globe size={20} />
              <span className="lang-code">{lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <ul className="dropdown__menu" role="menu">
                {LANGUAGES.map((l) => (
                  <li key={l.code}>
                    <button
                      role="menuitemradio"
                      aria-checked={lang === l.code}
                      className={lang === l.code ? 'is-active' : ''}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {user ? (
            <div className="dropdown">
              <button
                className="avatar-btn"
                onClick={() => { setUserOpen((v) => !v); setLangOpen(false); }}
                aria-label="Menu tài khoản"
                aria-expanded={userOpen}
              >
                {user.fullName.charAt(0)}
              </button>
              {userOpen && (
                <ul className="dropdown__menu dropdown__menu--right" role="menu">
                  <li className="dropdown__meta">
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                  </li>
                  <li><Link to="/profile"><User size={16} /> {t('profile')}</Link></li>
                  {isAdmin && <li><Link to="/admin"><LayoutDashboard size={16} /> {t('admin')}</Link></li>}
                  <li><button onClick={logout}><LogOut size={16} /> {t('logout')}</button></li>
                </ul>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn--primary btn--sm header-login">{t('login')}</Link>
          )}

          <button
            className="icon-btn hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
