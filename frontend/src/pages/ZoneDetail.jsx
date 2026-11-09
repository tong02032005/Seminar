import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Maximize, MapPin } from 'lucide-react';
import AnimalList from '../components/animals/AnimalList';
import ImageWithFallback from '../components/common/ImageWithFallback';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getAnimals, getZoneById } from '../services/api';
import { mediaUrl } from '../services/config';
import { formatArea, formatHours } from '../utils/format';

/** UC02 bước 4 – mô tả khu và các động vật đang hiện trong khu */
export default function ZoneDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: zone, error, reload } = useAsync(() => getZoneById(id, lang), [id, lang]);
  const animals = useAsync(() => getAnimals({ zone_id: id, size: 100, lang }), [id, lang]);
  useDocumentTitle(zone?.name);

  // E1: khu không tồn tại → báo và đưa về danh sách khu vực
  useEffect(() => {
    if (error?.status === 404) {
      toast.error(t('notFound'));
      navigate('/zones', { replace: true });
    }
  }, [error, navigate, toast, t]);

  if (error) return <div className="container section"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <article>
      <header className="zone-hero" style={{ '--zone-color': zone?.color }}>
        {zone ? <ImageWithFallback src={mediaUrl(zone.image)} alt="" fallbackEmoji="🌿" className="zone-hero__img" /> : <Skeleton height="100%" radius={0} />}
        <div className="container zone-hero__content">
          <Link to="/zones" className="back-link back-link--light"><ChevronLeft size={18} /> {t('allZonesLink')}</Link>
          <h1>{zone?.name ?? t('loading')}</h1>
          {zone && (
            <ul className="zone-hero__meta">
              {zone.open_hours && <li><Clock size={16} /> {formatHours(zone.open_hours)}</li>}
              {zone.area_m2 && <li><Maximize size={16} /> {formatArea(zone.area_m2)}</li>}
              <li>🐾 {zone.animal_count} {t('species')}</li>
            </ul>
          )}
        </div>
      </header>

      <section className="section">
        <div className="container">
          {zone && (
            <div className="zone-intro">
              <p>{zone.description}</p>
              <Link to={`/map?zone=${zone.id}`} className="btn btn--outline"><MapPin size={18} /> {t('viewOnMap')}</Link>
            </div>
          )}
          <h2 className="section-title">{t('animalsInZone')}</h2>
          <AnimalList
            animals={animals.data?.items}
            loading={animals.loading}
            error={animals.error}
            onRetry={animals.reload}
            empty={<EmptyState icon="🌱" title={t('zoneEmpty')} actionLabel={t('allZonesLink')} actionTo="/zones" />}
          />
        </div>
      </section>
    </article>
  );
}
