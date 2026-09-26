import { API_CONFIG } from './config';
import { tokenStorage } from './tokenStorage';

/** Lỗi API thống nhất cho cả mock và API thật */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path, params) => {
  const url = new URL(path, API_CONFIG.BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }
  return url.toString();
};

/**
 * Wrapper duy nhất quanh fetch. Tự gắn header Authorization: Bearer <JWT>.
 * Component KHÔNG gọi hàm này trực tiếp – chỉ dùng qua services/api.js.
 */
async function request(method, path, { params, body, isForm = false } = {}) {
  const headers = {};
  const token = tokenStorage.getToken();
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
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 0);
  }

  if (response.status === 401) tokenStorage.clear();

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    // FastAPI trả lỗi dạng { detail: "..." }
    throw new ApiError(data?.detail || `Yêu cầu thất bại (${response.status})`, response.status, data);
  }
  return data;
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, { body: formData, isForm: true }),
};
