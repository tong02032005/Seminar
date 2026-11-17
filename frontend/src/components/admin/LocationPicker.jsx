/**
 * Chọn vị trí POI bằng cách bấm/kéo ghim trên bản đồ khu – admin không cần gõ vĩ độ/kinh độ.
 * Khung bản đồ lấy theo các POI cùng khu (ít hơn 2 điểm thì lấy cả sở thú), nới rộng thêm lề để còn chỗ đặt điểm mới.
 *
 *   pois     – POI hiện có [{ id, name, icon, latitude, longitude, zone_id }]
 *   zone     – khu của động vật { id, name, color } (có thể rỗng)
 *   currentId – id POI đang sửa (không vẽ trùng)
 *   value    – { latitude, longitude } ('' nếu chưa chọn)
 *   onChange – ({ latitude, longitude }) => void
 */
import { useRef, useState } from 'react';

const MIN_SPAN = 0.0008; // độ (~90 m): khung nhỏ nhất khi khu có ít điểm
const MAX_SPREAD = 0.01; // bỏ điểm nhập nhầm ở quá xa
export const MIN_DISTANCE_M = 15; // trùng với backend: hai chuồng phải cách nhau ít nhất 15 m
const DEFAULT_CENTER = { latitude: 10.788, longitude: 106.705 }; // sở thú mẫu, dùng khi chưa có POI nào

const median = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

function frame(points) {
  if (!points.length) points = [DEFAULT_CENTER];
  const range = (vals) => {
    const mid = median(vals);
    const near = vals.filter((x) => Math.abs(x - mid) <= MAX_SPREAD);
    const [lo, hi] = [Math.min(...near), Math.max(...near)];
    const half = Math.max(hi - lo, MIN_SPAN) * 0.75; // nới 25% mỗi bên
    const c = (lo + hi) / 2;
    return [c - half, c + half];
  };
  return { lat: range(points.map((p) => p.latitude)), lng: range(points.map((p) => p.longitude)) };
}

/** Khoảng cách gần đúng (m), cùng công thức với backend */
export function distanceM(a, b) {
  const dy = (b.latitude - a.latitude) * 110574;
  const dx = (b.longitude - a.longitude) * 111320 * Math.cos((((a.latitude + b.latitude) / 2) * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

const round = (v) => Math.round(v * 1e6) / 1e6;

export default function LocationPicker({ pois, zone, currentId, value, onChange }) {
  const box = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [clash, setClash] = useState(null); // chuồng bị trùng khi bấm vào chỗ đã có
  const others = pois.filter((p) => p.id !== currentId);
  const sameZone = zone ? others.filter((p) => p.zone_id === zone.id) : [];
  const ref = sameZone.length >= 2 ? sameZone : others;
  const has = value.latitude !== '' && value.longitude !== '';
  const f = frame(ref);

  const clamp = (v) => Math.min(100, Math.max(0, v)); // tọa độ ngoài khung (nhập nhầm) thì ghim ở mép
  const toPct = (p) => ({
    left: `${clamp(((p.longitude - f.lng[0]) / (f.lng[1] - f.lng[0])) * 100)}%`,
    top: `${clamp((1 - (p.latitude - f.lat[0]) / (f.lat[1] - f.lat[0])) * 100)}%`,
  });
  const visible = (p) => p.latitude >= f.lat[0] && p.latitude <= f.lat[1] && p.longitude >= f.lng[0] && p.longitude <= f.lng[1];

  const place = (e) => {
    const r = box.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const pos = {
      latitude: round(f.lat[0] + (1 - y) * (f.lat[1] - f.lat[0])),
      longitude: round(f.lng[0] + x * (f.lng[1] - f.lng[0])),
    };
    const hit = others.find((p) => distanceM(p, pos) < MIN_DISTANCE_M);
    setClash(hit ?? null);
    if (!hit) onChange(pos); // chỗ đã có chuồng thì giữ ghim ở vị trí cũ
  };

  return (
    <div className="loc-picker">
      <div
        ref={box}
        className="loc-picker__map"
        style={{ '--zone': zone?.color ?? '#6FA86B' }}
        role="application"
        aria-label="Bản đồ chọn vị trí POI: bấm để đặt ghim, kéo ghim để chỉnh"
        onPointerDown={(e) => { box.current.setPointerCapture(e.pointerId); setDragging(true); place(e); }}
        onPointerMove={(e) => dragging && place(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {zone && <span className="loc-picker__zone">{zone.name}</span>}
        {others.filter(visible).map((p) => (
          <span key={p.id} className={`loc-picker__other ${p.zone_id === zone?.id ? '' : 'is-far'}`} style={toPct(p)} title={p.name}>
            {p.icon && p.icon !== 'paw' ? p.icon : '🐾'}
          </span>
        ))}
        {has && <span className="loc-picker__pin" style={toPct({ latitude: Number(value.latitude), longitude: Number(value.longitude) })} aria-hidden="true">📍</span>}
      </div>
      {clash && <small className="field__error" role="alert">Chỗ này trùng với {clash.name}, hãy chọn chỗ khác (cách ít nhất {MIN_DISTANCE_M} m).</small>}
      <small className="field__hint">
        {has ? 'Kéo hoặc bấm chỗ khác để đổi vị trí.' : 'Bấm vào bản đồ để đặt vị trí chuồng.'} Biểu tượng mờ là chuồng ở khu khác.
      </small>
    </div>
  );
}
