import { API_CONFIG, IS_STATIC } from './config';
import { staticGet } from './staticApi';
import { tokenStorage } from './tokenStorage';

/** Lỗi API thống nhất: message lấy từ {"detail": "..."} của FastAPI */
export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildUrl = (path, params) => {
  const url = new URL(path, API_CONFIG.BASE_URL);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url.toString();
};

/** FastAPI trả lỗi 422 dạng detail = [{msg, loc}] → gộp thành một câu dễ đọc */
const errorMessage = (data, status) => {
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((d) => `${d.loc?.slice(-1)[0] ?? ''}: ${d.msg}`.replace(/^: /, '')).join('; ');
  }
  if (status === 0) return 'Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa rồi thử lại.';
  return `Yêu cầu thất bại (${status})`;
};

/**
 * Wrapper duy nhất quanh fetch. Có token admin thì tự gắn header Authorization: Bearer <JWT>.
 * 401 khi đang có token (hết hạn / đã đổi mật khẩu) → xóa token và báo AuthContext đưa về trang đăng nhập.
 */
async function request(method, path, { params, body, isForm = false, raw = false, guest = false } = {}) {
  if (IS_STATIC) {
    if (method !== 'GET' || !guest) throw new ApiError('Bản tĩnh chỉ có phần xem, không có chức năng quản trị.', 0);
    return staticGet(path, params).catch((err) => { throw new ApiError(err.message, err.status ?? 0); });
  }
  const headers = {};
  const token = guest ? null : tokenStorage.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(errorMessage(null, 0), 0);
  }

  if (response.status === 401 && token) {
    tokenStorage.clear();
    window.dispatchEvent(new Event('auth:expired'));
  }
  if (raw && response.ok) return response.blob();

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(errorMessage(data, response.status), response.status);
  return data;
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  /** GET không gửi token: xem dữ liệu đúng như khách thấy */
  guestGet: (path, params) => request('GET', path, { params, guest: true }),
  post: (path, body, params) => request('POST', path, { body, params }),
  put: (path, body, params) => request('PUT', path, { body, params }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path, params) => request('DELETE', path, { params }),
  upload: (path, formData) => request('POST', path, { body: formData, isForm: true }),
  blob: (path) => request('GET', path, { raw: true }),
};
