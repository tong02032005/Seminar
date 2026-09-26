import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Maximize, MapPin } from 'lucide-react';
import AnimalList from '../components/animals/AnimalList';
import ImageWithFallback from '../components/common/ImageWithFallback';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getZoneById } from '../services/api';

export default function ZoneDetail() {
  const { id } = useParams();
  const { data: zone, loading, error, reload } = useAsync(() => getZoneById(id), [id]);
  useDocumentTitle(zone?.name);

  if (error) return <div className="container section"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <article>
      <header className="zone-hero" style={{ '--zone-color': zone?.color }}>
        {zone ? (
          <ImageWithFallback src={zone.image} alt="" fallbackEmoji={zone.emoji} className="zone-hero__img" />
        ) : (
          <Skeleton height="100%" radius={0} />
        )}
        <div className="container zone-hero__content">
          <Link to="/zones" className="back-link back-link--light"><ChevronLeft size={18} /> Tất cả khu vực</Link>
          <h1>{zone?.name ?? 'Đang tải…'}</h1>
          {zone && (
            <ul className="zone-hero__meta">
              <li><Clock size={16} /> {zone.openHours}</li>
              <li><Maximize size={16} /> {zone.area}</li>
              <li><span aria-hidden="true">{zone.emoji}</span> {zone.animals.length} loài</li>
            </ul>
          )}
        </div>
      </header>

      <section className="section">
        <div className="container">
          {zone && (
            <div className="zone-intro">
              <p>{zone.description}</p>
              <Link to={`/map?focus=${zone.id}`} className="btn btn--outline"><MapPin size={18} /> Xem trên bản đồ</Link>
            </div>
          )}
          <h2 className="section-title">Động vật trong khu</h2>
          <AnimalList
            animals={zone?.animals}
            loading={loading}
            empty={<EmptyState icon="🌱" title="Khu vực đang cập nhật" message="Chưa có loài nào được giới thiệu trong khu này." actionLabel="Xem khu khác" actionTo="/zones" />}
          />
        </div>
      </section>
    </article>
  );
}
