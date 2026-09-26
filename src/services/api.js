/**
 * API SERVICE – điểm duy nhất để lấy/ghi dữ liệu từ backend (backend/main.py).
 *
 * Backend trả JSON camelCase nên component dùng trực tiếp, không cần chuyển đổi.
 * Component chỉ import từ file này, không gọi fetch trực tiếp.
 */
import { http } from './httpClient';

/* ============================ ANIMALS ============================ */

/** GET /api/animals?search=&category=&zone=&sort=&featured= */
export const getAnimals = (params = {}) => http.get('/api/animals', params);

/** GET /api/animals/{id} */
export const getAnimalById = (id) => http.get(`/api/animals/${id}`);

/** GET /api/animals/qr/{code} – tra cứu động vật theo mã QR in trên biển chuồng */
export const getAnimalByQrCode = (code) =>
  http.get(`/api/animals/qr/${encodeURIComponent(code.trim().toUpperCase())}`);

/** GET /api/animals/{id}/related */
export const getRelatedAnimals = (id, limit = 4) => http.get(`/api/animals/${id}/related`, { limit });

export const createAnimal = (data) => http.post('/api/animals', data);
export const updateAnimal = (id, data) => http.put(`/api/animals/${id}`, data);
export const deleteAnimal = (id) => http.delete(`/api/animals/${id}`);

/* ============================ ZONES ============================ */

/** GET /api/zones – kèm animalCount mỗi khu */
export const getZones = () => http.get('/api/zones');

/** GET /api/zones/{id} – kèm danh sách animals trong khu */
export const getZoneById = (id) => http.get(`/api/zones/${id}`);

export const createZone = (data) => http.post('/api/zones', data);
export const updateZone = (id, data) => http.put(`/api/zones/${id}`, data);
export const deleteZone = (id) => http.delete(`/api/zones/${id}`);

/* ============================ TOURS & MAP ============================ */

/** GET /api/tours */
export const getTours = () => http.get('/api/tours');

/** GET /api/map/points */
export const getMapPoints = () => http.get('/api/map/points');

/* ============================ AUTH ============================ */

/** POST /api/auth/login → { access_token, token_type, user } */
export const login = ({ email, password }) => http.post('/api/auth/login', { email, password });

/** POST /api/auth/register → { access_token, token_type, user } */
export const register = ({ fullName, email, password }) =>
  http.post('/api/auth/register', { fullName, email, password });

/** GET /api/auth/me – kiểm tra token còn hợp lệ */
export const getCurrentUser = () => http.get('/api/auth/me');

/** PUT /api/users/me */
export const updateProfile = (data) => http.put('/api/users/me', data);

/* ============================ USERS (ADMIN) ============================ */

export const getUsers = () => http.get('/api/users');
export const updateUser = (id, data) => http.patch(`/api/users/${id}`, data);
export const deleteUser = (id) => http.delete(`/api/users/${id}`);

/* ============================ REVIEWS ============================ */

/** GET /api/reviews?animal_id=&user_id=&status= */
export const getReviews = ({ animalId, userId, status } = {}) =>
  http.get('/api/reviews', { animal_id: animalId, user_id: userId, status });

/** POST /api/reviews – người gửi lấy từ JWT */
export const createReview = ({ animalId, rating, comment }) =>
  http.post('/api/reviews', { animalId: Number(animalId), rating, comment });

export const updateReviewStatus = (id, status) => http.patch(`/api/reviews/${id}`, { status });
export const deleteReview = (id) => http.delete(`/api/reviews/${id}`);

/* ============================ ADMIN ============================ */

/** GET /api/admin/stats */
export const getDashboardStats = () => http.get('/api/admin/stats');

/** GET/PUT /api/admin/settings */
export const getSettings = () => http.get('/api/admin/settings');
export const updateSettings = (data) => http.put('/api/admin/settings', data);

/** GET /api/health */
export const getHealth = () => http.get('/api/health');
