/**
 * BẢN ĐỒ SỞ THÚ DẠNG MINH HỌA (SVG + marker HTML), không cần thư viện bản đồ.
 * POI có vĩ độ/kinh độ thật; component chiếu chúng vào khung hình theo khoảng tọa độ của các điểm
 * (bắc ở trên, đông bên phải). Thay bằng Leaflet sau này thì giữ nguyên props.
 *   points     – POI [{ id, name, latitude, longitude, zone_id }]
 *   zones      – để lấy màu khu vực
 *   selectedId – id POI đang chọn
 *   onSelect   – (poi) => void
 */
const PAD = 14; // % lề để marker không dính mép

export default function ZooMap({ points, zones = [], selectedId, onSelect }) {
  const zoneColor = (zoneId) => zones.find((z) => z.id === zoneId)?.color ?? '#6FA86B';
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const scale = (v, min, max) => (max === min ? 50 : PAD + ((v - min) / (max - min)) * (100 - 2 * PAD));
  const pos = (p) => ({ x: scale(p.longitude, minLng, maxLng), y: 100 - scale(p.latitude, minLat, maxLat) });

  return (
    <div className="zoo-map" role="application" aria-label="Map">
      <svg className="zoo-map__art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="grass" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.25" fill="#B9D6A6" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="#E4EFD9" />
        <rect width="100" height="100" fill="url(#grass)" />
        <path d="M58 58 C 66 52, 80 54, 86 60 C 92 68, 84 76, 74 76 C 64 76, 54 70, 58 58 Z" fill="#BFDDEA" />
        <path
          d="M50 100 L50 52 M50 52 C 40 46, 30 38, 22 30 M50 52 C 60 44, 68 36, 76 28 M50 52 L50 18 M50 70 C 40 68, 30 67, 20 66 M50 70 C 60 68, 70 67, 78 66"
          stroke="#F7F3E8" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 14 }}
        />
        {points.map((p) => {
          const { x, y } = pos(p);
          return <circle key={p.id} cx={x} cy={y} r="6" fill={zoneColor(p.zone_id)} opacity={selectedId === p.id ? 0.35 : 0.14} />;
        })}
      </svg>

      {points.map((p) => {
        const { x, y } = pos(p);
        return (
          <button
            key={p.id}
            className={`map-marker map-marker--zone ${selectedId === p.id ? 'is-selected' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, '--marker-color': zoneColor(p.zone_id) }}
            onClick={() => onSelect(p)}
            aria-label={p.name}
            aria-pressed={selectedId === p.id}
          >
            <span className="map-marker__pin" aria-hidden="true"><span>🐾</span></span>
            <span className="map-marker__label">{p.animal_name}</span>
          </button>
        );
      })}
    </div>
  );
}
