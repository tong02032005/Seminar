import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Expand, Navigation } from 'lucide-react';
import AnimalList from '../components/animals/AnimalList';
import NarrationPlayer from '../components/animals/NarrationPlayer';
import ConservationBadge from '../components/common/ConservationBadge';
import ImageWithFallback from '../components/common/ImageWithFallback';
import Modal from '../components/common/Modal';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getAnimalById, getRelatedAnimals } from '../services/api';
import { mediaUrl } from '../services/config';

const SECTIONS = ['appearance', 'distribution', 'ecology', 'behaviour', 'diet', 'reproduction', 'lifespan', 'ecological_role', 'threat'];

/** UC01 bước 6 – chi tiết động vật theo ngôn ngữ, vị trí trên bản đồ, thuyết minh (UC03), động vật liên quan */
export default function AnimalDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [imageOpen, setImageOpen] = useState(false);

  const { data: animal, loading, error, reload } = useAsync(() => getAnimalById(id, lang), [id, lang]);
  const related = useAsync(() => getRelatedAnimals(id, lang), [id, lang]);
  useDocumentTitle(animal?.name);

  // E3: động vật bị ẩn hoặc không tồn tại → báo rồi đưa khách về danh sách
  useEffect(() => {
    if (error?.status === 404) {
      toast.error(t('notFound'));
      navigate('/animals', { replace: true });
    }
  }, [error, navigate, toast, t]);

  if (error) return <div className="container section"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading && !animal) return <DetailSkeleton />;
  if (!animal) return null;

  return (
    <article className="animal-detail">
      <div className="container">
        <Link to="/animals" className="back-link"><ChevronLeft size={18} /> {t('allAnimals')}</Link>

        <div className="animal-detail__top">
          <button className="animal-detail__image" onClick={() => setImageOpen(true)} aria-label={animal.name}>
            <ImageWithFallback src={mediaUrl(animal.image)} alt={animal.name} fallbackEmoji="🐾" />
            <span className="animal-detail__zoom"><Expand size={18} /></span>
          </button>

          <div className="animal-detail__info">
            <div className="animal-detail__tags">
              {animal.category_name && <span className="badge badge--neutral">{animal.category_name}</span>}
              <ConservationBadge code={animal.conservation_status_code} name={animal.conservation_status_name} color={animal.conservation_status_color} />
            </div>
            <h1>{animal.name}</h1>
            <p className="scientific scientific--lg">{animal.scientific_name}</p>
            <p className="animal-detail__zone">
              <MapPin size={16} /> {t('zone')}: <Link to={`/zones/${animal.zone_id}`}>{animal.zone_name}</Link>
            </p>
            {animal.poi ? (
              <>
                <p className="animal-detail__zone"><Navigation size={16} /> {animal.poi.name}{animal.poi.direction ? ` – ${animal.poi.direction}` : ''}</p>
                <div className="animal-detail__actions">
                  <Link to={`/map?focus=${animal.poi.id}`} className="btn btn--outline"><MapPin size={18} /> {t('viewOnMap')}</Link>
                </div>
              </>
            ) : (
              <p className="muted">{t('noLocation')}</p>
            )}
            <NarrationPlayer poi={animal.poi} />
          </div>
        </div>

        <section className="fact-grid fact-grid--text" aria-label={animal.name}>
          {SECTIONS.filter((key) => animal[key]).map((key) => (
            <div key={key} className="fact">
              <div>
                <p className="fact__label">{t(key)}</p>
                <p className="fact__value">{animal[key]}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="section section--compact">
          <h2 className="section-title">{t('related')}</h2>
          <AnimalList animals={related.data} loading={related.loading} error={related.error} skeletonCount={4} />
        </section>
      </div>

      <Modal open={imageOpen} onClose={() => setImageOpen(false)} title={animal.name} size="xl">
        <ImageWithFallback src={mediaUrl(animal.image)} alt={animal.name} fallbackEmoji="🐾" className="lightbox-img" />
      </Modal>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="container animal-detail" aria-busy="true">
      <Skeleton width={140} height={18} />
      <div className="animal-detail__top">
        <Skeleton height={420} radius={20} />
        <div className="stack">
          <Skeleton width="40%" height={22} />
          <Skeleton width="70%" height={44} />
          <Skeleton height={120} radius={16} />
        </div>
      </div>
    </div>
  );
}
