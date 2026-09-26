import { Star } from 'lucide-react';

/** Hiển thị hoặc chọn số sao (1–5). Truyền onChange để thành input. */
export default function StarRating({ value = 0, onChange, size = 18 }) {
  return (
    <div className={`stars ${onChange ? 'stars--input' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} sao`}
            onClick={() => onChange(n)}
          >
            <Star size={size} className={n <= value ? 'is-filled' : ''} />
          </button>
        ) : (
          <Star key={n} size={size} className={n <= value ? 'is-filled' : ''} />
        )
      )}
    </div>
  );
}
