import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Cuộn lên đầu trang mỗi khi đổi route (trừ khi có #hash) */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
