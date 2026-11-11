import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Eye, EyeOff, Map, MapPinned, MapPinOff, Radio } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getDashboardStats, getLanguages, getVisitorStats } from '../../services/api';

const REFRESH_MS = 5_000; // tự tải lại để số "đang truy cập" luôn mới

/** Số khách đang mở trang khách lúc này (backend còn lượt xem theo ngày / trang xem nhiều nhất, chưa hiển thị) */
function OnlineNow() {
  const { data, error, reload } = useAsync(getVisitorStats, []);
  useEffect(() => {
    const timer = setInterval(reload, REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  if (!data) return error ? <ErrorState error={error} onRetry={reload} /> : <Skeleton height={96} radius={14} />;
  return <StatCard icon={Radio} label="Đang truy cập" value={data.online_now} tone="green" note="Cập nhật mỗi 5 giây" />;
}

/** UC09 – thống kê đếm trực tiếp từ CSDL */
export default function Dashboard() {
  useDocumentTitle('Tổng quan');
  const { data: stats, loading, error, reload } = useAsync(getDashboardStats, []);
  const languages = useAsync(() => getLanguages(), []);
  const langName = (code) => languages.data?.find((l) => l.code === code)?.name ?? code;

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const cards = stats && [
    { icon: PawPrint, label: 'Tổng động vật', value: stats.total_animals, tone: 'green' },
    { icon: Eye, label: 'Đang hiện', value: stats.visible_animals, tone: 'sky' },
    { icon: EyeOff, label: 'Đang ẩn', value: stats.hidden_animals, tone: 'sand' },
    { icon: Map, label: 'Khu vực', value: stats.total_zones, tone: 'green' },
    { icon: MapPinned, label: 'POI', value: stats.total_pois, tone: 'sky' },
    { icon: MapPinOff, label: 'Động vật chưa có POI', value: stats.animals_without_poi, tone: 'sand' },
  ];

  return (
    <div className="stack-lg">
      <div className="stat-grid">
        <OnlineNow />
      </div>

      <div className="stat-grid">
        {loading || !cards
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={96} radius={14} />)
          : cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {stats?.animals_without_poi > 0 && (
        <div className="alert alert--info">
          Có {stats.animals_without_poi} động vật chưa có vị trí trên bản đồ. <Link to="/admin/pois">Thêm POI</Link>
        </div>
      )}

      <section className="panel">
        <h3>Thuyết minh theo ngôn ngữ</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Ngôn ngữ</th><th>POI thiếu lời thuyết minh</th><th>POI chưa có âm thanh</th></tr></thead>
            <tbody>
              {stats?.by_language.map((row) => (
                <tr key={row.lang}>
                  <td data-label="Ngôn ngữ">{langName(row.lang)}</td>
                  <td data-label="Thiếu lời thuyết minh">{row.pois_missing_narration} / {stats.total_pois}</td>
                  <td data-label="Chưa có âm thanh">{row.pois_missing_audio} / {stats.total_pois}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
