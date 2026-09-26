import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/** Ô tìm kiếm mở từ Header, chuyển sang /animals?q=... */
export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/animals${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
    setQuery('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form className="container search-overlay__form" onSubmit={handleSubmit} role="search">
        <Search size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          aria-label="Tìm kiếm động vật"
        />
        <button type="submit" className="btn btn--primary btn--sm">Tìm</button>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng tìm kiếm">
          <X size={20} />
        </button>
      </form>
    </div>
  );
}
