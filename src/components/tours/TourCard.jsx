import { Clock, Footprints, Users } from 'lucide-react';

/** Card tuyến tham quan. `active` dùng khi đang chọn tuyến trên trang /tour */
export default function TourCard({ tour, active = false, onSelect, children }) {
  return (
    <article className={`tour-card ${active ? 'is-active' : ''}`}>
      <div className="tour-card__icon" aria-hidden="true">{tour.emoji}</div>
      <div className="tour-card__body">
        <h3>{tour.name}</h3>
        <p>{tour.description}</p>
        <ul className="tour-card__meta">
          <li><Clock size={14} /> {tour.duration}</li>
          <li><Footprints size={14} /> {tour.distance}</li>
          <li><Users size={14} /> {tour.audience}</li>
        </ul>
        {onSelect && (
          <button className={`btn btn--sm ${active ? 'btn--primary' : 'btn--outline'}`} onClick={() => onSelect(tour)}>
            {active ? 'Đang xem tuyến này' : 'Xem lộ trình'}
          </button>
        )}
        {children}
      </div>
    </article>
  );
}
