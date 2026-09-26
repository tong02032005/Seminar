import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Facebook, Youtube, Instagram } from 'lucide-react';
import Logo from './Logo';
import { MAIN_NAV } from './navLinks';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo light />
          <p>
            Thông tin động vật, bản đồ và tuyến tham quan giúp bạn hiểu hơn về từng loài
            ngay tại chuồng nuôi.
          </p>
          <div className="socials">
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
          </div>
        </div>

        <div>
          <h4>Liên kết nhanh</h4>
          <ul>
            {MAIN_NAV.map((item) => (
              <li key={item.to}><Link to={item.to}>{t(item.key)}</Link></li>
            ))}
            <li><Link to="/qr">{t('qr')}</Link></li>
            <li><Link to="/chat">{t('chat')}</Link></li>
          </ul>
        </div>

        <div>
          <h4>Liên hệ</h4>
          <ul className="contact-list">
            <li><MapPin size={16} /> 2B Nguyễn Bỉnh Khiêm, Bến Nghé, Quận 1, TP. Hồ Chí Minh</li>
            <li><Mail size={16} /> <a href="mailto:hotro@zooguide.vn">hotro@zooguide.vn</a></li>
            <li><Phone size={16} /> <a href="tel:02838291425">028 3829 1425</a></li>
          </ul>
        </div>

        <div>
          <h4>Giờ mở cửa</h4>
          <p>Hằng ngày: 7:30 – 17:30</p>
          <p>Khu thủy sinh và khu chim: 8:00 – 17:00</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <div className="container">© {new Date().getFullYear()} ZooGuide. Đồ án hệ thống thuyết minh thông minh trong sở thú.</div>
      </div>
    </footer>
  );
}
