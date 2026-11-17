import { Link } from 'react-router-dom';
import { X, Navigation } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback';
import NarrationPlayer from '../animals/NarrationPlayer';
import { mediaUrl } from '../../services/config';
import { useLanguage } from '../../context/LanguageContext';

/** UC02 bước 8 – bấm một điểm: tên chuồng, chỉ dẫn, liên kết động vật, nghe thuyết minh (UC03) */
export default function MapInfoPanel({ poi, onClose }) {
  const { t } = useLanguage();
  if (!poi) {
    return <aside className="map-panel map-panel--empty"><p>{t('pickPoint')}</p></aside>;
  }
  return (
    <aside className="map-panel" aria-live="polite">
      <header className="map-panel__head">
        <span className="map-panel__icon" aria-hidden="true">🐾</span>
        <div>
          <small>{poi.animal_name}</small>
          <h3>{poi.name}</h3>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')}><X size={18} /></button>
      </header>
      {poi.direction && <p className="map-panel__direction"><Navigation size={16} /> {poi.direction}</p>}
      <Link to={`/animals/${poi.animal_id}`} className="map-panel__animal">
        <ImageWithFallback src={mediaUrl(poi.animal_image)} alt="" fallbackEmoji="🐾" />
        <span>{poi.animal_name} · {t('viewDetail')}</span>
      </Link>
      <NarrationPlayer poi={poi} compact />
    </aside>
  );
}
