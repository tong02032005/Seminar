import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IS_STATIC } from '../../services/config';
import { trackVisit } from '../../services/api';

const HEARTBEAT_MS = 5_000; // backend coi khách đã rời nếu 15 giây không có tín hiệu
const KEY = 'zooguide_visitor';
const newId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

let fallbackId = null;
/** Mã ngẫu nhiên cho trình duyệt này (lưu localStorage): cùng mã = cùng một khách */
function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) localStorage.setItem(KEY, (id = newId()));
    return id;
  } catch {
    return (fallbackId ??= newId());
  }
}

const send = (path) => trackVisit(visitorId(), path).catch(() => {}); // lỗi thống kê không ảnh hưởng khách

let lastPath = null; // StrictMode (dev) chạy effect 2 lần: không ghi trùng lượt xem

/** Thống kê người dùng: ghi lượt xem mỗi khi khách đổi trang, và báo "đang online" mỗi 5 giây khi tab đang mở */
export default function VisitTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (IS_STATIC || pathname === lastPath) return;
    lastPath = pathname;
    send(pathname);
  }, [pathname]);

  useEffect(() => {
    if (IS_STATIC) return undefined;
    const timer = setInterval(() => document.visibilityState === 'visible' && send(), HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, []);

  return null;
}
