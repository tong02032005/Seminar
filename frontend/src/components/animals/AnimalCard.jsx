import { Link } from 'react-router-dom';
import { MapPin, Headphones } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback';
import { mediaUrl } from '../../services/config';
import { useLanguage } from '../../context/LanguageContext';

/** Card động vật – dùng ở Trang chủ, Danh sách, Khu vực, Liên quan. Cả card là link tới trang chi tiết. */
export default function AnimalCard({ animal }) {
  const { t } = useLanguage();
  return (
    <article className="animal-card">
      <Link to={`/animals/${animal.id}`} className="animal-card__link" aria-label={`${t('viewDetail')}: ${animal.name}`}>
        <div className="animal-card__media">
          <ImageWithFallback src={mediaUrl(animal.image)} alt={animal.name} fallbackEmoji="🐾" />
          {animal.category_name && <span className="animal-card__category">{animal.category_name}</span>}
          <span className="animal-card__cta">{t('viewDetail')}</span>
        </div>
        <div className="animal-card__body">
          <h3>{animal.name}</h3>
          <p className="scientific">{animal.scientific_name}</p>
          <p className="animal-card__zone">
            <MapPin size={14} /> {animal.zone_name}
            {animal.has_poi && <Headphones size={14} className="animal-card__audio" aria-label={t('narration')} />}
          </p>
        </div>
      </Link>
    </article>
  );
}
