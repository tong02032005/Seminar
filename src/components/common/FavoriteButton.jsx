import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';

/** Nút yêu thích – variant "icon" (tròn trên card) hoặc "full" (có chữ) */
export default function FavoriteButton({ animal, variant = 'icon' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();
  const active = isFavorite(animal.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(animal.id);
    toast.info(added ? `Đã thêm ${animal.name} vào yêu thích` : `Đã bỏ ${animal.name} khỏi yêu thích`);
  };

  if (variant === 'full') {
    return (
      <button className={`btn ${active ? 'btn--favorite-active' : 'btn--outline'}`} onClick={handleClick} aria-pressed={active}>
        <Heart size={18} fill={active ? 'currentColor' : 'none'} />
        {active ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
      </button>
    );
  }

  return (
    <button
      className={`fav-btn ${active ? 'is-active' : ''}`}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Bỏ yêu thích ${animal.name}` : `Yêu thích ${animal.name}`}
    >
      <Heart size={18} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
