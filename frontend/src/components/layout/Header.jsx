import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Globe, Menu, X } from 'lucide-react';
import Logo from './Logo';
import SearchOverlay from './SearchOverlay';
import { MAIN_NAV } from './navLinks';
import { useScrolled } from '../../hooks/useScrolled';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_LABELS } from '../../utils/translations';

/** Thanh đầu trang của khách: logo, menu, tìm kiếm, nút chọn ngôn ngữ (UC04). Không có đăng nhập. */
export default function Header() {
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const { lang, setLang, languages, t } = useLanguage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Trang chủ: header trong suốt trên ảnh hero, đặc lại khi cuộn
  const transparent = pathname === '/' && !scrolled && !menuOpen;

  useEffect(() => {
    setMenuOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className={`site-header ${transparent ? 'is-transparent' : 'is-solid'} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <Logo light={transparent} />

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Menu">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="main-nav__link">
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions" ref={dropdownRef}>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={t('search')}>
            <Search size={20} />
          </button>

          <div className="dropdown">
            <button
              className="icon-btn"
              onClick={() => setLangOpen((v) => !v)}
              aria-label={t('language')}
              aria-expanded={langOpen}
            >
              <Globe size={20} />
              <span className="lang-code">{LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <ul className="dropdown__menu dropdown__menu--right" role="menu">
                {languages.map((l) => (
                  <li key={l.code}>
                    <button
                      role="menuitemradio"
                      aria-checked={lang === l.code}
                      className={lang === l.code ? 'is-active' : ''}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                    >
                      {LANGUAGE_LABELS[l.code] ?? l.code.toUpperCase()} · {l.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="icon-btn hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
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
