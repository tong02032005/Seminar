import { Search, X } from 'lucide-react';
import { CATEGORIES } from '../../constants/catalog';

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'name-asc', label: 'Tên A → Z' },
  { value: 'name-desc', label: 'Tên Z → A' },
];

/**
 * Thanh tìm kiếm + lọc nhóm + lọc khu vực + sắp xếp.
 * Component "controlled": giá trị và onChange do trang cha quản lý.
 */
export default function AnimalFilters({ filters, zones = [], onChange, onReset }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = filters.search || filters.category || filters.zone;

  return (
    <div className="filters">
      <div className="search-input">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={filters.search}
          onChange={set('search')}
          placeholder="Tìm theo tên hoặc tên khoa học…"
          aria-label="Tìm động vật"
        />
      </div>

      <div className="chip-row" role="group" aria-label="Lọc theo nhóm">
        <button
          className={`chip ${!filters.category ? 'is-active' : ''}`}
          onClick={() => onChange({ ...filters, category: '' })}
        >
          Tất cả
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip ${filters.category === c.id ? 'is-active' : ''}`}
            onClick={() => onChange({ ...filters, category: c.id })}
            aria-pressed={filters.category === c.id}
          >
            <span aria-hidden="true">{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      <div className="filters__selects">
        <label className="select">
          <span>Khu vực</span>
          <select value={filters.zone} onChange={set('zone')}>
            <option value="">Tất cả khu vực</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </label>
        <label className="select">
          <span>Sắp xếp</span>
          <select value={filters.sort} onChange={set('sort')}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        {active && (
          <button className="btn btn--ghost btn--sm" onClick={onReset}>
            <X size={16} /> Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
