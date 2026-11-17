/**
 * BẢN ĐỒ SỞ THÚ DẠNG MINH HỌA (SVG + marker HTML), không cần thư viện bản đồ.
 * POI có vĩ độ/kinh độ thật; component chiếu chúng vào khung hình (bắc ở trên, đông bên phải).
 *
 * Hai chế độ:
 *  - Toàn sở thú (zoneId rỗng): mỗi khu là một vùng màu có tên, đường đi từ cổng chính tới từng khu.
 *    Bấm vào vùng của khu để mở bản đồ riêng của khu đó.
 *  - Một khu (zoneId): phóng to riêng khu đó – nền theo màu khu, cảnh trí riêng (cây, hồ, đá, cỏ),
 *    lối vào khu và đường dạo nối các chuồng.
 *
 *   points       – POI [{ id, name, animal_name, animal_image, icon, latitude, longitude, zone_id }]
 *   zones        – [{ id, name, color }]
 *   zoneId       – khu đang xem ('' = toàn sở thú)
 *   selectedId   – id POI đang chọn
 *   onSelect     – (poi) => void
 *   onZoneSelect – (zoneId) => void  (bấm vào một khu ở bản đồ tổng)
 */
import ImageWithFallback from '../common/ImageWithFallback';
import { mediaUrl } from '../../services/config';

const VB_W = 160; // khung SVG cùng tỉ lệ 16:11 với khung bản đồ để hình tròn không bị méo
const VB_H = 110;
const PAD = 14; // % lề để marker không dính mép
const MAX_SPREAD = 0.01; // độ (~1 km): điểm xa trung vị hơn mức này coi là nhập sai tọa độ
const FALLBACK_COLOR = '#6FA86B';
// Vị trí CỐ ĐỊNH của 5 khu trên bản đồ tổng (% khung), theo thứ tự id: thú ăn thịt (tây bắc), linh trưởng (bắc),
// thảo nguyên (đông bắc), chim (tây nam), bò sát & thủy sinh (đông nam). Cổng chính ở giữa cạnh dưới.
const ZONE_SLOTS = [
  { cx: 19, cy: 27, rx: 15, ry: 21 },
  { cx: 50, cy: 22, rx: 13, ry: 18 },
  { cx: 81, cy: 30, rx: 15, ry: 24 },
  { cx: 25, cy: 72, rx: 17, ry: 19 },
  { cx: 75, cy: 72, rx: 17, ry: 19 },
];
const EXTRA_SLOT = { cx: 50, cy: 58, rx: 9, ry: 12 }; // phòng khi CSDL cũ còn khu thứ 6

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** Khoảng tọa độ để vẽ, bỏ qua điểm lệch quá xa (tọa độ nhập nhầm) để chúng không ép các điểm khác dồn lại */
function bounds(values) {
  const mid = median(values);
  const near = values.filter((v) => Math.abs(v - mid) <= MAX_SPREAD);
  return [Math.min(...near), Math.max(...near)];
}

/** Hàm chiếu tọa độ -> % khung hình; điểm nằm ngoài khoảng được ghim ở mép */
function projector(points, pad) {
  const [minLat, maxLat] = bounds(points.map((p) => p.latitude));
  const [minLng, maxLng] = bounds(points.map((p) => p.longitude));
  const scale = (v, min, max) => (max === min ? 50
    : Math.min(100 - pad / 2, Math.max(pad / 2, pad + ((v - min) / (max - min)) * (100 - 2 * pad))));
  return (p) => ({ x: scale(p.longitude, minLng, maxLng), y: 100 - scale(p.latitude, minLat, maxLat) });
}

/** Số giả ngẫu nhiên theo hạt giống: mỗi khu luôn có cùng một cảnh trí */
function seeded(seed) {
  let t = seed * 9301 + 49297;
  return () => {
    t = (t * 9301 + 49297) % 233280;
    return t / 233280;
  };
}

/** Đường cong mềm đi qua các điểm (Catmull-Rom -> Bezier), tọa độ theo khung SVG */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const toVb = ({ x, y }) => [(x * VB_W) / 100, (y * VB_H) / 100];

/* ---------- cảnh trí cho bản đồ một khu ---------- */
const THEMES = ['forest', 'savanna', 'wetland', 'rocky'];
// đoán cảnh trí theo tên khu (vi/en/zh); khu khác thì chọn theo id
const THEME_WORDS = [
  ['savanna', /thảo nguyên|savanna|草原/i],
  ['wetland', /chim|bird|鸟|thủy|aquatic|水/i],
  ['forest', /linh trưởng|primate|灵长/i],
  ['rocky', /ăn thịt|carnivore|食肉|bò sát|reptile|爬行/i],
];
const themeOf = (zone) => THEME_WORDS.find(([, re]) => re.test(zone.name))?.[0] ?? THEMES[zone.id % THEMES.length];

function Scenery({ theme, color, seed }) {
  const rand = seeded(seed);
  const items = [];
  const spot = () => [rand() * VB_W, rand() * VB_H];
  if (theme === 'wetland') {
    items.push(<ellipse key="lake1" cx={VB_W * 0.72} cy={VB_H * 0.35} rx="30" ry="16" fill="#BFDDEA" />);
    items.push(<ellipse key="lake2" cx={VB_W * 0.25} cy={VB_H * 0.72} rx="20" ry="10" fill="#BFDDEA" />);
    for (let i = 0; i < 22; i += 1) {
      const [x, y] = spot();
      items.push(<path key={`r${i}`} d={`M${x} ${y} l0 -4 M${x + 1.2} ${y} l0.8 -3.5 M${x - 1.2} ${y} l-0.8 -3.5`} stroke="#7FA86A" strokeWidth="0.6" strokeLinecap="round" />);
    }
  }
  if (theme === 'savanna') {
    for (let i = 0; i < 30; i += 1) {
      const [x, y] = spot();
      items.push(<path key={`g${i}`} d={`M${x - 2} ${y} q2 -4 4 0`} stroke="#C9B26B" strokeWidth="0.7" fill="none" />);
    }
    for (let i = 0; i < 6; i += 1) {
      const [x, y] = spot();
      items.push(
        <g key={`a${i}`}>
          <line x1={x} y1={y} x2={x} y2={y - 5} stroke="#8A6A3A" strokeWidth="0.8" />
          <ellipse cx={x} cy={y - 6} rx="6" ry="2" fill="#8DAA5B" />
        </g>
      );
    }
  }
  if (theme === 'forest') {
    for (let i = 0; i < 26; i += 1) {
      const [x, y] = spot();
      const r = 3 + rand() * 3;
      items.push(<circle key={`t${i}`} cx={x} cy={y} r={r} fill={i % 2 ? '#7FAE6E' : '#93BE80'} opacity="0.85" />);
    }
  }
  if (theme === 'rocky') {
    for (let i = 0; i < 18; i += 1) {
      const [x, y] = spot();
      const w = 3 + rand() * 4;
      items.push(<ellipse key={`s${i}`} cx={x} cy={y} rx={w} ry={w * 0.6} fill="#C8C2B4" opacity="0.8" />);
    }
    items.push(<ellipse key="pool" cx={VB_W * 0.5} cy={VB_H * 0.5} rx="16" ry="9" fill="#BFDDEA" />);
  }
  return (
    <>
      <rect width={VB_W} height={VB_H} fill={color} opacity="0.12" />
      {items}
    </>
  );
}

/* ---------- marker: ảnh động vật, nếu không có thì icon ---------- */
function Marker({ poi, x, y, color, selected, onSelect }) {
  const icon = poi.icon && poi.icon !== 'paw' ? poi.icon : '🐾';
  return (
    <button
      className={`map-marker map-marker--zone ${selected ? 'is-selected' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, '--marker-color': color }}
      onClick={() => onSelect(poi)}
      aria-label={poi.name}
      aria-pressed={selected}
    >
      <span className="map-marker__pin" aria-hidden="true">
        {poi.animal_image ? (
          <span className="map-marker__photo">
            <ImageWithFallback src={mediaUrl(poi.animal_image)} alt="" fallbackEmoji={icon} />
            <i>{icon}</i>
          </span>
        ) : (
          <span>{icon}</span>
        )}
      </span>
      <span className="map-marker__label">{poi.animal_name}</span>
    </button>
  );
}

export default function ZooMap({ points, zones = [], zoneId = '', selectedId, onSelect, onZoneSelect }) {
  const zone = zones.find((z) => String(z.id) === String(zoneId));
  const zoneColor = (id) => zones.find((z) => z.id === id)?.color ?? FALLBACK_COLOR;
  const project = projector(points, zone ? 20 : PAD);
  const placed = points.map((p) => ({ poi: p, ...project(p) }));

  if (zone) {
    // ----- bản đồ riêng một khu -----
    const color = zone.color ?? FALLBACK_COLOR;
    const theme = themeOf(zone);
    const route = [{ x: 4, y: 94 }, ...[...placed].sort((a, b) => a.x - b.x || a.y - b.y)].map(toVb);
    return (
      <div className="zoo-map zoo-map--zone" role="application" aria-label={zone.name}>
        <svg className="zoo-map__art" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
          <rect width={VB_W} height={VB_H} fill="#E9F1E0" />
          <Scenery theme={theme} color={color} seed={zone.id} />
          {/* hàng rào khu */}
          <rect x="3" y="3" width={VB_W - 6} height={VB_H - 6} rx="10" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
          {/* đường dạo từ lối vào qua các chuồng */}
          <path d={smoothPath(route)} stroke="#F7F3E8" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d={smoothPath(route)} stroke={color} strokeWidth="0.6" fill="none" strokeDasharray="2 2" opacity="0.7" />
          {/* khu chuồng của từng con */}
          {placed.map(({ poi, x, y }) => {
            const [vx, vy] = toVb({ x, y });
            return (
              <rect key={poi.id} x={vx - 12} y={vy - 6} width="24" height="14" rx="4"
                fill={color} opacity={selectedId === poi.id ? 0.35 : 0.18} stroke={color} strokeWidth="0.5" />
            );
          })}
        </svg>
        <span className="zoo-map__badge" style={{ '--zone-color': color }}>{zone.name}</span>
        <span className="zoo-map__gate" style={{ left: '4%', top: '94%' }}>🚪</span>
        {placed.map(({ poi, x, y }) => (
          <Marker key={poi.id} poi={poi} x={x} y={y} color={color} selected={selectedId === poi.id} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  // ----- bản đồ toàn sở thú: 5 khu ở vị trí cố định, POI vẽ bên trong vùng của khu mình -----
  const ordered = [...zones].sort((a, b) => a.id - b.id);
  const areas = ordered.map((z, i) => ({ zone: z, ...(ZONE_SLOTS[i] ?? EXTRA_SLOT) }));
  const inArea = areas.flatMap((a) => {
    const own = points.filter((p) => p.zone_id === a.zone.id);
    const local = projector(own.length ? own : [{ latitude: 0, longitude: 0 }], 0);
    return own.map((poi) => {
      const { x, y } = local(poi); // 0..100 trong khu
      return { poi, x: a.cx + ((x - 50) / 50) * a.rx * 0.6, y: a.cy + 4 + ((y - 50) / 50) * a.ry * 0.5 };
    });
  });
  const gate = { x: 50, y: 98 };

  return (
    <div className="zoo-map" role="application" aria-label="Map">
      <svg className="zoo-map__art" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="grass" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.35" fill="#B9D6A6" />
          </pattern>
        </defs>
        <rect width={VB_W} height={VB_H} fill="#E4EFD9" />
        <rect width={VB_W} height={VB_H} fill="url(#grass)" />
        {/* đường chính từ cổng tới từng khu */}
        {areas.map((a) => {
          const [gx, gy] = toVb(gate);
          const [zx, zy] = toVb({ x: a.cx, y: a.cy });
          return <path key={a.zone.id} d={`M${gx} ${gy} Q${gx} ${(gy + zy) / 2}, ${zx} ${zy}`} stroke="#F7F3E8" strokeWidth="4" fill="none" strokeLinecap="round" />;
        })}
        {/* vùng của từng khu */}
        {areas.map((a) => {
          const [cx, cy] = toVb({ x: a.cx, y: a.cy });
          return (
            <ellipse key={a.zone.id} className="zoo-map__zone" cx={cx} cy={cy} rx={(a.rx * VB_W) / 100} ry={(a.ry * VB_H) / 100}
              fill={a.zone.color ?? FALLBACK_COLOR} fillOpacity="0.16" stroke={a.zone.color ?? FALLBACK_COLOR} strokeOpacity="0.5" strokeDasharray="2 1.5" strokeWidth="0.6" />
          );
        })}
      </svg>
      {/* tên khu: bấm để mở bản đồ riêng của khu */}
      {areas.map((a) => (
        <button key={a.zone.id} className="zoo-map__zone-name" type="button"
          style={{ left: `${a.cx}%`, top: `${Math.max(3, a.cy - a.ry)}%`, '--zone-color': a.zone.color ?? FALLBACK_COLOR }}
          onClick={() => onZoneSelect?.(String(a.zone.id))}>
          {a.zone.name} ›
        </button>
      ))}
      <span className="zoo-map__gate" style={{ left: `${gate.x}%`, top: `${gate.y}%` }}>🚪</span>
      {inArea.map(({ poi, x, y }) => (
        <Marker key={poi.id} poi={poi} x={x} y={y} color={zoneColor(poi.zone_id)} selected={selectedId === poi.id} onSelect={onSelect} />
      ))}
    </div>
  );
}
