import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback';

export default function ZoneCard({ zone }) {
  return (
    <Link to={`/zones/${zone.id}`} className="zone-card" style={{ '--zone-color': zone.color }}>
      <ImageWithFallback src={zone.image} alt={zone.name} fallbackEmoji={zone.emoji} className="zone-card__img" />
      <div className="zone-card__overlay">
        <h3>{zone.name}</h3>
        <p className="zone-card__meta">
          {zone.animalCount !== undefined && <span>{zone.animalCount} loài</span>}
          <span><Clock size={13} /> {zone.openHours}</span>
        </p>
      </div>
    </Link>
  );
}
