import { Link } from 'react-router-dom';

export default function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo--light' : ''}`} aria-label="ZooGuide – về trang chủ">
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="currentColor" className="logo__bg" />
        <path d="M11 27c2.5-9 8-14 18-15.5-1.2 9-6.5 15.5-15.5 16.8" fill="#9CCB86" />
        <path d="M12.5 28.5c3.8-5.2 7.6-8.4 12.6-11.5" stroke="#1E4331" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <span>ZooGuide</span>
    </Link>
  );
}
