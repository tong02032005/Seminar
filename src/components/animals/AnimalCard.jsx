import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback';
import FavoriteButton from '../common/FavoriteButton';
import { getCategoryLabel } from '../../constants/catalog';

/**
 * Card động vật – tái sử dụng ở Trang chủ, Danh sách, Khu vực, Yêu thích, Liên quan.
 * Cả card là link tới trang chi tiết; nút yêu thích chặn sự kiện để không điều hướng.
 */
export default function AnimalCard({ animal }) {
  return (
    <article className="animal-card">
      <Link to={`/animals/${animal.id}`} className="animal-card__link" aria-label={`Xem chi tiết ${animal.name}`}>
        <div className="animal-card__media">
          <ImageWithFallback src={animal.image} alt={animal.name} fallbackEmoji={animal.emoji} />
          <span className="animal-card__category">{getCategoryLabel(animal.category)}</span>
          <span className="animal-card__cta">Xem chi tiết</span>
        </div>
        <div className="animal-card__body">
          <h3>{animal.name}</h3>
          <p className="scientific">{animal.scientificName}</p>
          <p className="animal-card__zone"><MapPin size={14} /> {animal.zoneName}</p>
        </div>
      </Link>
      <div className="animal-card__fav">
        <FavoriteButton animal={animal} />
      </div>
    </article>
  );
}
