/**
 * BẢN ĐỒ SỞ THÚ DẠNG MOCKUP (SVG + marker HTML).
 *
 * Interface props được giữ đơn giản để sau này có thể viết LeafletZooMap / GoogleZooMap
 * với cùng props và thay thế trong pages/Map.jsx:
 *   points      – mảng điểm { id, type, name, icon, x, y } (x, y theo %; bản thật dùng lat/lng)
 *   zones       – để lấy màu khu vực
 *   selectedId  – id điểm đang chọn
 *   onSelect    – (point) => void
 *   route       – mảng id điểm theo thứ tự để vẽ lộ trình (tùy chọn)
 *   visibleTypes– lọc loại điểm hiển thị
 */
export default function ZooMap({ points, zones = [], selectedId, onSelect, route = [], visibleTypes }) {
  const zoneColor = (zoneId) => zones.find((z) => z.id === zoneId)?.color ?? '#6FA86B';
  const zonePoints = points.filter((p) => p.type === 'zone');
  const shown = visibleTypes ? points.filter((p) => visibleTypes.includes(p.type)) : points;

  const routeCoords = route
    .map((id) => points.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <div className="zoo-map" role="application" aria-label="Bản đồ sở thú">
      <svg className="zoo-map__art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="grass" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.25" fill="#B9D6A6" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="#E4EFD9" />
        <rect width="100" height="100" fill="url(#grass)" />

        {/* Hồ nước trung tâm và suối */}
        <path d="M58 58 C 66 52, 80 54, 86 60 C 92 68, 84 76, 74 76 C 64 76, 54 70, 58 58 Z" fill="#BFDDEA" />
        <path d="M86 60 C 92 56, 96 48, 100 44" stroke="#BFDDEA" strokeWidth="2.2" fill="none" />

        {/* Nền màu từng khu */}
        {zonePoints.map((p) => (
          <ellipse
            key={p.id}
            cx={p.x}
            cy={p.y}
            rx="15"
            ry="12"
            fill={zoneColor(p.zoneId)}
            opacity={selectedId === p.id ? 0.32 : 0.16}
            className="zoo-map__zone"
          />
        ))}

        {/* Lối đi chính */}
        <path
          d="M50 100 L50 52 M50 52 C 40 46, 30 38, 22 30 M50 52 C 60 44, 68 36, 76 28 M50 52 L50 18 M50 70 C 40 68, 30 67, 20 66 M50 70 C 60 68, 70 67, 78 66"
          stroke="#F7F3E8"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 14 }}
        />

        {/* Cây trang trí */}
        {[[8, 10], [12, 48], [90, 12], [92, 88], [6, 88], [36, 8], [64, 8], [34, 44], [88, 40]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#8DBF78" opacity="0.8" />
        ))}

        {routeCoords && (
          <polyline
            points={routeCoords}
            fill="none"
            stroke="#E07A2F"
            strokeDasharray="1.6 1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 4 }}
            className="zoo-map__route"
          />
        )}
      </svg>

      {shown.map((point) => {
        const order = route.indexOf(point.id);
        return (
          <button
            key={point.id}
            className={`map-marker map-marker--${point.type} ${selectedId === point.id ? 'is-selected' : ''}`}
            style={{ left: `${point.x}%`, top: `${point.y}%`, '--marker-color': point.zoneId ? zoneColor(point.zoneId) : undefined }}
            onClick={() => onSelect(point)}
            aria-label={point.name}
            aria-pressed={selectedId === point.id}
          >
            <span className="map-marker__pin" aria-hidden="true"><span>{point.icon}</span></span>
            <span className="map-marker__label">{point.name}</span>
            {order > -1 && <span className="map-marker__order">{order + 1}</span>}
          </button>
        );
      })}
    </div>
  );
}
