import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { MAP_POINT_TYPES } from '../../constants/catalog';
import ImageWithFallback from '../common/ImageWithFallback';

/** Bảng thông tin khi click marker trên bản đồ */
export default function MapInfoPanel({ point, animals = [], onClose }) {
  if (!point) {
    return (
      <aside className="map-panel map-panel--empty">
        <p>Chọn một điểm trên bản đồ để xem mô tả, các loài động vật và đường đi.</p>
      </aside>
    );
  }

  return (
    <aside className="map-panel" aria-live="polite">
      <header className="map-panel__head">
        <span className="map-panel__icon" aria-hidden="true">{point.icon}</span>
        <div>
          <small>{MAP_POINT_TYPES[point.type]}</small>
          <h3>{point.name}</h3>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
      </header>
      <p>{point.description}</p>

      {point.type === 'zone' && (
        <>
          <h4>Động vật trong khu ({animals.length})</h4>
          <ul className="map-panel__animals">
            {animals.map((a) => (
              <li key={a.id}>
                <Link to={`/animals/${a.id}`}>
                  <ImageWithFallback src={a.image} alt="" fallbackEmoji={a.emoji} />
                  <span>{a.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to={`/zones/${point.zoneId}`} className="btn btn--primary btn--block">Xem khu vực</Link>
        </>
      )}
    </aside>
  );
}
