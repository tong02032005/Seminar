/**
 * API SERVICE – điểm duy nhất gọi backend FastAPI (thư mục backend/).
 * Mọi API GET nhận lang (vi | en | zh); bỏ trống thì backend dùng ngôn ngữ mặc định.
 * Hàm cho trang KHÁCH dùng http.guestGet (không gửi token) để admin đang đăng nhập cùng trình duyệt
 * vẫn thấy đúng như khách (không thấy động vật/POI đang ẩn). Hàm có hậu tố Admin gửi token.
 * Component chỉ import từ file này, không gọi fetch trực tiếp.
 */
import { http } from './httpClient';

/* ============================ HỆ THỐNG, NGÔN NGỮ ============================ */
export const getHealth = () => http.get('/api/health');
/** Tên sở thú, giờ mở cửa, hotline, ngôn ngữ mặc định (công khai) */
export const getPublicSettings = () => http.guestGet('/api/systems/public');
/** Ngôn ngữ đang bật (guest: true – như khách thấy, kể cả khi admin đang đăng nhập); admin có token: tất cả */
export const getLanguages = ({ guest = false } = {}) => (guest ? http.guestGet('/api/languages') : http.get('/api/languages'));
export const setLanguageActive = (code, isActive) => http.patch(`/api/languages/${code}`, { is_active: isActive });
export const getDashboardStats = () => http.get('/api/systems/dashboard');
/** Thống kê người dùng: khách báo đang xem (path có = vừa mở trang) / admin xem số liệu */
export const trackVisit = (visitorId, path) => http.post('/api/visits', { visitor_id: visitorId, path });
export const getVisitorStats = () => http.get('/api/systems/visitors');
export const getSettings = () => http.get('/api/systems/settings');
export const updateSettings = (data) => http.put('/api/systems/settings', data);

/* ============================ TRA CỨU ============================ */
export const getCategories = (lang) => http.guestGet('/api/categories', { lang });
export const getConservationStatuses = (lang) => http.guestGet('/api/conservation-statuses', { lang });

/* ============================ ĐỘNG VẬT ============================ */
/** GET /api/animals?q=&category_id=&zone_id=&sort=name|popular|newest&page=&size=&lang= → {items, total, page, size} */
export const getAnimals = (params = {}) => http.guestGet('/api/animals', params);
export const getAnimalById = (id, lang) => http.guestGet(`/api/animals/${id}`, { lang });
export const getRelatedAnimals = (id, lang, limit = 4) => http.guestGet(`/api/animals/${id}/related`, { lang, limit });
/** Admin: danh sách gồm cả động vật đang ẩn */
export const getAnimalsAdmin = (params = {}) => http.get('/api/animals', params);
export const getAnimalAdmin = (id) => http.get(`/api/animals/${id}/admin`);
export const createAnimal = (data) => http.post('/api/animals', data);
export const updateAnimal = (id, data) => http.patch(`/api/animals/${id}`, data);
export const deleteAnimal = (id) => http.delete(`/api/animals/${id}`);
export const uploadAnimalImage = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return http.upload(`/api/animals/${id}/image`, form);
};

/* ============================ KHU VỰC ============================ */
export const getZones = (lang) => http.guestGet('/api/zones', { lang });
export const getZoneById = (id, lang) => http.guestGet(`/api/zones/${id}`, { lang });
export const getZonesAdmin = () => http.get('/api/zones', { lang: 'vi' });
export const getZoneAdmin = (id) => http.get(`/api/zones/${id}/admin`);
export const updateZone = (id, data) => http.patch(`/api/zones/${id}`, data);
export const uploadZoneImage = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return http.upload(`/api/zones/${id}/image`, form);
};

/* ============================ POI & THUYẾT MINH ============================ */
/** Khách: POI của động vật đang hiện; admin: tất cả, kèm narration_langs, audio_langs */
export const getPois = (params = {}) => http.guestGet('/api/pois', params);
export const getPoiById = (id, lang) => http.guestGet(`/api/pois/${id}`, { lang });
export const getPoisAdmin = () => http.get('/api/pois', { lang: 'vi' });
export const getPoiAdmin = (id) => http.get(`/api/pois/${id}/admin`);
export const createPoi = (data) => http.post('/api/pois', data);
export const updatePoi = (id, data) => http.patch(`/api/pois/${id}`, data);
export const deletePoi = (id) => http.delete(`/api/pois/${id}`);
/** Dịch lời thuyết minh sang các ngôn ngữ còn lại → {translations: {en, zh}} (không lưu) */
export const translateNarration = (text, sourceLang) => http.post('/api/translate', { text, source_lang: sourceLang });
/** Tạo file mp3 nháp từ lời thuyết minh ĐÃ LƯU → {draft_id} */
export const createAudioPreview = (poiId, lang) => http.post(`/api/pois/${poiId}/audio/preview`, null, { lang });
/** Tải file nháp (cần token) → Blob để phát trong form */
export const getAudioPreview = (poiId, draftId) => http.blob(`/api/pois/${poiId}/audio/preview/${draftId}`);
export const saveAudio = (poiId, lang, draftId) => http.put(`/api/pois/${poiId}/audio`, { draft_id: draftId }, { lang });
export const deleteAudio = (poiId, lang) => http.delete(`/api/pois/${poiId}/audio`, { lang });

/* ============================ ADMIN ============================ */
export const login = ({ email, password }) => http.post('/api/auth/login', { email, password });
export const logout = () => http.post('/api/auth/logout');
export const getCurrentAdmin = () => http.get('/api/auth/me');
export const changePassword = (data) => http.patch('/api/auth/password', data);
