import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback';
import { mediaUrl } from '../../services/config';
import { useLanguage } from '../../context/LanguageContext';
import { formatHours } from '../../utils/format';

export default function ZoneCard({ zone }) {
  const { t } = useLanguage();
  return (
    <Link to={`/zones/${zone.id}`} className="zone-card" style={{ '--zone-color': zone.color }}>
      <ImageWithFallback src={mediaUrl(zone.image)} alt={zone.name} fallbackEmoji="🌿" className="zone-card__img" />
      <div className="zone-card__overlay">
        <h3>{zone.name}</h3>
        <p className="zone-card__meta">
          <span>{zone.animal_count} {t('species')}</span>
          {zone.open_hours && <span><Clock size={13} /> {formatHours(zone.open_hours)}</span>}
        </p>
      </div>
    </Link>
  );
}
