import { Link } from 'react-router-dom';
import { Clock, Phone } from 'lucide-react';
import Logo from './Logo';
import { MAIN_NAV } from './navLinks';
import { useLanguage } from '../../context/LanguageContext';
import { formatHours } from '../../utils/format';

export default function Footer() {
  const { t, info } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo light />
          <p>{t('footerText')}</p>
        </div>
        <div>
          <h4>{t('home')}</h4>
          <ul>
            {MAIN_NAV.map((item) => (
              <li key={item.to}><Link to={item.to}>{t(item.key)}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{info?.zoo_name ?? 'ZooGuide'}</h4>
          <ul className="contact-list">
            {info?.open_hours && <li><Clock size={16} /> {t('openHours')}: {formatHours(info.open_hours)}</li>}
            {info?.hotline && <li><Phone size={16} /> <a href={`tel:${info.hotline.replace(/\s/g, '')}`}>{info.hotline}</a></li>}
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <div className="container">© {new Date().getFullYear()} ZooGuide · Seminar</div>
      </div>
    </footer>
  );
}
