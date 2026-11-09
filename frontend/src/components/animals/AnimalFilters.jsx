import { Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/** Thanh tìm kiếm + lọc nhóm + lọc khu vực + sắp xếp (UC01 bước 3). Giá trị do trang cha quản lý. */
export default function AnimalFilters({ filters, categories = [], zones = [], onChange, onReset }) {
  const { t } = useLanguage();
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = filters.search || filters.category || filters.zone;

  return (
    <div className="filters">
      <div className="search-input">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={filters.search} onChange={set('search')} placeholder={t('search')} aria-label={t('search')} />
      </div>

      <div className="chip-row" role="group" aria-label={t('category')}>
        <button className={`chip ${!filters.category ? 'is-active' : ''}`} onClick={() => onChange({ ...filters, category: '' })}>
          {t('all')}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${filters.category === String(c.id) ? 'is-active' : ''}`}
            onClick={() => onChange({ ...filters, category: String(c.id) })}
            aria-pressed={filters.category === String(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="filters__selects">
        <label className="select">
          <span>{t('zone')}</span>
          <select value={filters.zone} onChange={set('zone')}>
            <option value="">{t('allZones')}</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </label>
        <label className="select">
          <span>{t('sort')}</span>
          <select value={filters.sort} onChange={set('sort')}>
            <option value="popular">{t('sortPopular')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="newest">{t('sortNewest')}</option>
          </select>
        </label>
        {active && (
          <button className="btn btn--ghost btn--sm" onClick={onReset}><X size={16} /> {t('clearFilters')}</button>
        )}
      </div>
    </div>
  );
}
