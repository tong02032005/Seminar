import { Link } from 'react-router-dom';
import { PawPrint, Map, Users, Ticket, MessageSquareText } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import BarChart from '../../components/admin/BarChart';
import LineChart from '../../components/admin/LineChart';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getDashboardStats, getAnimals } from '../../services/api';
import { formatNumber } from '../../utils/format';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { data: stats, loading, error, reload } = useAsync(getDashboardStats, []);
  const top = useAsync(() => getAnimals({ sort: 'popular' }), []);

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const cards = stats && [
    { icon: PawPrint, label: 'Động vật', value: stats.animals, tone: 'green' },
    { icon: Map, label: 'Khu vực', value: stats.zones, tone: 'sky' },
    { icon: Users, label: 'Người dùng', value: stats.users, tone: 'sand' },
    { icon: Ticket, label: 'Lượt tham quan', value: formatNumber(stats.visits), note: '6 tháng gần nhất', tone: 'green' },
    { icon: MessageSquareText, label: 'Đánh giá', value: stats.reviews, note: `Trung bình ${stats.averageRating} ★`, tone: 'sky' },
  ];

  return (
    <div className="stack-lg">
      <div className="stat-grid">
        {loading || !cards
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={96} radius={14} />)
          : cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {stats?.pendingReviews > 0 && (
        <div className="alert alert--info">
          Có {stats.pendingReviews} đánh giá đang chờ duyệt. <Link to="/admin/reviews">Duyệt ngay</Link>
        </div>
      )}

      <div className="chart-grid">
        <section className="panel">
          <h3>Lượt tham quan theo tháng</h3>
          {stats ? <LineChart data={stats.visitsByMonth} /> : <Skeleton height={220} />}
        </section>
        <section className="panel">
          <h3>Số động vật theo khu vực</h3>
          {stats ? <BarChart data={stats.animalsByZone} /> : <Skeleton height={220} />}
        </section>
      </div>

      <section className="panel">
        <h3>Động vật được quan tâm nhiều nhất</h3>
        <ol className="rank-list">
          {top.data?.slice(0, 5).map((a) => (
            <li key={a.id}>
              <span>{a.emoji} {a.name}</span>
              <span className="rank-list__bar"><i style={{ width: `${a.popularity}%` }} /></span>
              <span className="rank-list__value">{a.popularity}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
