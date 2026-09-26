/**
 * Nhãn hiển thị cho các mã cố định. Backend (main.py) dùng đúng các mã này
 * (CategoryId, ConservationCode) để kiểm tra dữ liệu gửi lên.
 */
export const CATEGORIES = [
  { id: 'mammals', label: 'Thú có vú', emoji: '🐾' },
  { id: 'birds', label: 'Chim', emoji: '🪶' },
  { id: 'reptiles', label: 'Bò sát', emoji: '🦎' },
  { id: 'amphibians', label: 'Lưỡng cư', emoji: '🐸' },
  { id: 'aquatic', label: 'Động vật dưới nước', emoji: '🐢' },
];

export const CONSERVATION_STATUS = {
  LC: { label: 'Ít quan tâm', tone: 'safe' },
  NT: { label: 'Sắp bị đe dọa', tone: 'notice' },
  VU: { label: 'Sắp nguy cấp', tone: 'warn' },
  EN: { label: 'Nguy cấp', tone: 'danger' },
  CR: { label: 'Cực kỳ nguy cấp', tone: 'danger' },
};

export const MAP_POINT_TYPES = {
  gate: 'Lối vào',
  zone: 'Khu động vật',
  facility: 'Tiện ích',
};

export const getCategoryLabel = (id) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;
