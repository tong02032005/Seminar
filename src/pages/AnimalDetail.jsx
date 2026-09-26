import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Navigation, QrCode, Trees, Utensils, Hourglass, Ruler, Globe2, ShieldAlert, Sparkles, Lightbulb, Expand,
} from 'lucide-react';
import AnimalList from '../components/animals/AnimalList';
import FavoriteButton from '../components/common/FavoriteButton';
import ConservationBadge from '../components/common/ConservationBadge';
import ImageWithFallback from '../components/common/ImageWithFallback';
import Modal from '../components/common/Modal';
import ErrorState from '../components/common/ErrorState';
import Skeleton from '../components/common/Skeleton';
import QRCodePreview from '../components/qr/QRCodePreview';
import ReviewSection from '../components/animals/ReviewSection';
import { CONSERVATION_STATUS, getCategoryLabel } from '../constants/catalog';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAnimalById, getRelatedAnimals, getZoneById } from '../services/api';

export default function AnimalDetail() {
  const { id } = useParams();
  const [qrOpen, setQrOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const { data: animal, loading, error, reload } = useAsync(() => getAnimalById(id), [id]);
  const zone = useAsync(() => (animal ? getZoneById(animal.zone) : Promise.resolve(null)), [animal?.zone]);
  const related = useAsync(() => getRelatedAnimals(id), [id]);

  useDocumentTitle(animal?.name);

  if (error) return <div className="container section"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading || !animal) return <DetailSkeleton />;

  const facts = [
    { icon: Trees, label: 'Môi trường sống', value: animal.habitat },
    { icon: Utensils, label: 'Thức ăn', value: animal.diet },
    { icon: Hourglass, label: 'Tuổi thọ', value: animal.lifespan },
    { icon: Ruler, label: 'Kích thước', value: animal.size },
    { icon: Globe2, label: 'Phân bố', value: animal.distribution },
    { icon: ShieldAlert, label: 'Tình trạng bảo tồn', value: CONSERVATION_STATUS[animal.conservationStatus]?.label },
  ];

  const pageUrl = `${window.location.origin}/animals/${animal.id}`;

  return (
    <article className="animal-detail">
      <div className="container">
        <Link to="/animals" className="back-link"><ChevronLeft size={18} /> Tất cả động vật</Link>

        <div className="animal-detail__top">
          <button className="animal-detail__image" onClick={() => setImageOpen(true)} aria-label="Phóng to hình ảnh">
            <ImageWithFallback src={animal.image} alt={animal.name} fallbackEmoji={animal.emoji} />
            <span className="animal-detail__zoom"><Expand size={18} /></span>
          </button>

          <div className="animal-detail__info">
            <div className="animal-detail__tags">
              <span className="badge badge--neutral">{getCategoryLabel(animal.category)}</span>
              <ConservationBadge status={animal.conservationStatus} />
            </div>
            <h1>{animal.name}</h1>
            <p className="scientific scientific--lg">{animal.scientificName}</p>
            {zone.data && (
              <p className="animal-detail__zone">
                <MapPin size={16} /> <Link to={`/zones/${zone.data.id}`}>{zone.data.name}</Link> · Mã {animal.qrCode}
              </p>
            )}
            <p className="animal-detail__desc">{animal.description}</p>

            <div className="animal-detail__actions">
              <FavoriteButton animal={animal} variant="full" />
              <Link to={`/map?focus=${animal.zone}`} className="btn btn--outline"><MapPin size={18} /> Xem vị trí</Link>
              <Link to={`/map?route=gate,${animal.zone}`} className="btn btn--outline"><Navigation size={18} /> Chỉ đường</Link>
              <button className="btn btn--outline" onClick={() => setQrOpen(true)}><QrCode size={18} /> QR Code</button>
            </div>
          </div>
        </div>

        <section className="fact-grid" aria-label="Thông tin cơ bản">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="fact">
              <Icon size={20} className="fact__icon" />
              <div>
                <p className="fact__label">{label}</p>
                <p className="fact__value">{value || '—'}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="animal-detail__notes">
          {animal.features?.length > 0 && (
            <section className="note-card">
              <h2><Sparkles size={20} /> Đặc điểm nổi bật</h2>
              <ul>{animal.features.map((f) => <li key={f}>{f}</li>)}</ul>
            </section>
          )}
          {animal.funFacts?.length > 0 && (
            <section className="note-card note-card--sky">
              <h2><Lightbulb size={20} /> Có thể bạn chưa biết</h2>
              <ul>{animal.funFacts.map((f) => <li key={f}>{f}</li>)}</ul>
            </section>
          )}
        </div>

        <ReviewSection animalId={animal.id} animalName={animal.name} />

        <section className="section section--compact">
          <h2 className="section-title">Động vật liên quan</h2>
          <AnimalList animals={related.data} loading={related.loading} error={related.error} skeletonCount={4} />
        </section>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={`Mã QR – ${animal.name}`} size="sm">
        <div className="qr-modal">
          <QRCodePreview value={pageUrl} />
          <p className="qr-modal__code">{animal.qrCode}</p>
          <p className="muted">Mã minh họa. Khách có thể nhập mã {animal.qrCode} tại trang Quét QR.</p>
        </div>
      </Modal>

      <Modal open={imageOpen} onClose={() => setImageOpen(false)} title={animal.name} size="xl">
        <ImageWithFallback src={animal.image} alt={animal.name} fallbackEmoji={animal.emoji} className="lightbox-img" />
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
          <Skeleton width="50%" height={20} />
          <Skeleton height={80} />
          <Skeleton height={120} radius={16} />
        </div>
      </div>
    </div>
  );
}
