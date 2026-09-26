# ZooGuide – Hệ thống thuyết minh thông minh trong sở thú

| Phần | Công nghệ |
|---|---|
| Frontend | React 18 + Vite + React Router 6 + CSS thuần + Lucide Icons |
| Backend | Python FastAPI (1 file `backend/main.py`), JWT, lưu dữ liệu cục bộ bằng file JSON |
| CI/CD | GitHub Actions + Docker (GHCR) |

Frontend **không còn dữ liệu mock**: mọi dữ liệu (động vật, khu vực, tuyến, bản đồ, người dùng, đánh giá, chatbot, thống kê, cài đặt) đều lấy từ backend qua `src/services/api.js`.

## Chạy dự án (local)

Cần **Python ≥ 3.11** và **Node ≥ 20**.

```bash
npm install                # cài thư viện frontend (lần đầu)
npm run setup:api          # cài thư viện backend: fastapi, uvicorn, PyJWT (lần đầu)
npm run dev                # chạy SONG SONG backend + frontend trong 1 terminal
```

`npm run dev` dùng `concurrently` để bật cùng lúc:

| Log | Tiến trình | Địa chỉ |
|---|---|---|
| `[api]` | FastAPI (`uvicorn`, tự reload khi sửa `backend/`) | http://localhost:8000 – tài liệu API: http://localhost:8000/docs |
| `[web]` | Vite (React) | http://localhost:5173 |

Nhấn `Ctrl+C` để tắt cả hai. Nếu một tiến trình bị lỗi, tiến trình kia cũng dừng theo (`-k`) để không bị treo nửa chừng.
Muốn chạy riêng từng phần: `npm run dev:api` hoặc `npm run dev:web`.

> Frontend đọc địa chỉ backend từ `VITE_API_BASE_URL` (mặc định `http://localhost:8000`, không cần tạo `.env`).
> Nếu cổng 5173 đang bận, Vite tự chuyển sang 5174…; backend chấp nhận mọi cổng `localhost` nên vẫn gọi được.
> Máy dùng `python3` thay vì `python` (macOS/Linux): sửa `python` → `python3` trong 2 script `dev:api`, `setup:api` của `package.json`.

Lần chạy backend đầu tiên sẽ tạo `backend/data/db.json` từ `backend/seed.json`. Thêm/sửa/xóa trong trang Admin được ghi vào file này và **giữ lại sau khi khởi động lại**. Muốn khôi phục dữ liệu mẫu: xóa `backend/data/db.json` rồi chạy lại backend.

Hoặc chạy cả hai bằng Docker: `docker compose up --build` → frontend `http://localhost:8080`, backend `http://localhost:8000`.

Tài khoản dùng thử:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@zooguide.vn | admin123 |
| Khách | user@zooguide.vn | user123 |
| Bị khóa (để thử lỗi 403) | thuha@example.com | 123456 |

Mã QR thử: `ZOO-001` → `ZOO-013`.

## Cấu trúc thư mục

```
.
├── backend/
│   ├── main.py               # TOÀN BỘ API: cấu hình, lưu trữ JSON, JWT, schema, endpoint, chatbot
│   ├── seed.json             # dữ liệu mẫu ban đầu (trước đây nằm ở src/data)
│   ├── data/db.json          # dữ liệu đang dùng – tự tạo, không commit
│   ├── tests/                # pytest cho các endpoint
│   ├── requirements.txt      # fastapi, uvicorn, PyJWT
│   ├── requirements-dev.txt  # + pytest, httpx, ruff
│   └── Dockerfile
├── src/
│   ├── components/           # common, layout, animals, zones, tours, map, chatbot, qr, admin
│   ├── pages/                # mỗi route một file; pages/admin/ cho quản trị
│   ├── constants/catalog.js  # nhãn hiển thị cho mã nhóm, mức bảo tồn, loại điểm bản đồ
│   ├── services/
│   │   ├── config.js         # BASE_URL (VITE_API_BASE_URL)
│   │   ├── httpClient.js     # wrapper fetch duy nhất, tự gắn Bearer JWT, chuẩn hóa lỗi
│   │   ├── tokenStorage.js   # lưu JWT
│   │   ├── api.js            # TẤT CẢ hàm gọi backend
│   │   └── chatService.js    # chatbot → POST /api/chat
│   ├── hooks/  context/  routes/  styles/  utils/
├── .github/workflows/        # ci.yml, cd.yml
├── docs/CI-CD.md             # giải thích CI/CD
├── Dockerfile  nginx.conf    # image frontend (build Vite → nginx)
└── docker-compose.yml
```

## Frontend ↔ Backend

- Backend trả JSON **camelCase** (`scientificName`, `conservationStatus`…) nên component dùng trực tiếp, không cần chuyển đổi.
- Lỗi trả về dạng `{ "detail": "..." }` → `httpClient` chuyển thành `ApiError(message, status)` và các trang hiển thị qua `ErrorState`/toast.
- JWT: đăng nhập/đăng ký trả `{ access_token, token_type, user }`. `AuthContext` lưu token qua `tokenStorage`, `httpClient` tự gắn `Authorization: Bearer …`. Khi mở lại app, `AuthContext` gọi `GET /api/auth/me`; nếu token hết hạn hoặc tài khoản bị khóa/xóa thì tự đăng xuất.
- Backend bật CORS cho mọi cổng `localhost` khi chạy local (đổi bằng `ZOOGUIDE_CORS_ORIGINS` / `ZOOGUIDE_CORS_ORIGIN_REGEX`).
- Mã nhóm (`mammals`, `birds`…) và mức bảo tồn (`LC`…`CR`) được backend kiểm tra; nhãn tiếng Việt tương ứng nằm ở `src/constants/catalog.js`.

| Hàm trong `api.js` | Endpoint | Quyền |
|---|---|---|
| `getAnimals(params)` | `GET /api/animals?search=&category=&zone=&sort=&featured=` | công khai |
| `getAnimalById(id)` / `getRelatedAnimals(id)` | `GET /api/animals/{id}`, `GET /api/animals/{id}/related` | công khai |
| `getAnimalByQrCode(code)` | `GET /api/animals/qr/{code}` | công khai |
| `createAnimal` / `updateAnimal` / `deleteAnimal` | `POST /api/animals`, `PUT/DELETE /api/animals/{id}` | admin |
| `getZones()` / `getZoneById(id)` | `GET /api/zones`, `GET /api/zones/{id}` (kèm `animals`) | công khai |
| `createZone` / `updateZone` / `deleteZone` | `POST /api/zones`, `PUT/DELETE /api/zones/{id}` | admin |
| `getTours()` / `getMapPoints()` | `GET /api/tours`, `GET /api/map/points` | công khai |
| `login()` / `register()` | `POST /api/auth/login`, `POST /api/auth/register` | công khai |
| `getCurrentUser()` | `GET /api/auth/me` | đăng nhập |
| `updateProfile(data)` | `PUT /api/users/me` | đăng nhập |
| `getUsers` / `updateUser` / `deleteUser` | `GET /api/users`, `PATCH/DELETE /api/users/{id}` | admin |
| `getReviews({ animalId, userId, status })` | `GET /api/reviews?animal_id=&user_id=&status=` | công khai* |
| `createReview()` | `POST /api/reviews` | đăng nhập |
| `updateReviewStatus` / `deleteReview` | `PATCH/DELETE /api/reviews/{id}` | admin |
| `getDashboardStats()` | `GET /api/admin/stats` | admin |
| `getSettings()` / `updateSettings()` | `GET/PUT /api/admin/settings` | admin |
| `getHealth()` | `GET /api/health` | công khai |
| `sendChatMessage()` / `getChatSuggestions()` | `POST /api/chat`, `GET /api/chat/suggestions` | công khai |

\* Khách chỉ thấy đánh giá đã duyệt, trừ đánh giá của chính mình (trang Tài khoản); admin thấy tất cả.

Quy tắc nghiệp vụ nằm ở backend: không xóa được khu vực còn động vật; mã QR không trùng; xóa động vật thì xóa luôn đánh giá của nó; admin không tự khóa/xóa chính mình; khi bật "Tự động duyệt đánh giá 4–5 sao" trong Cài đặt thì đánh giá 4–5 sao được duyệt ngay.

### Biến môi trường backend

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `ZOOGUIDE_SECRET_KEY` | khóa dev | Khóa ký JWT – **bắt buộc đổi khi triển khai** |
| `ZOOGUIDE_DATA_FILE` | `backend/data/db.json` | Đường dẫn file dữ liệu |
| `ZOOGUIDE_CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Các origin frontend được phép gọi |
| `ZOOGUIDE_CORS_ORIGIN_REGEX` | mọi `http://localhost:<cổng>` | Origin được phép theo regex – đặt rỗng khi triển khai thật để chỉ dùng danh sách trên |
| `ZOOGUIDE_TOKEN_EXPIRE_MINUTES` | `1440` | Thời hạn token (phút) |

## Kiểm thử & lint

```bash
npm run lint                     # ESLint cho frontend
npm run build

cd backend
pip install -r requirements-dev.txt
ruff check .
pytest -q                        # dùng file dữ liệu tạm, không đụng tới data/db.json
```

## CI/CD (GitHub Actions)

> Giải thích chi tiết từng bước, cách cài đặt trên GitHub, cách xử lý khi lỗi và cách triển khai image: xem [docs/CI-CD.md](docs/CI-CD.md).

- **`ci.yml`** – chạy khi push lên `main`/`develop` và mỗi Pull Request:
  1. Frontend: `npm ci` → `npm run lint` → `npm run build` (lưu `dist/` làm artifact).
  2. Backend: `ruff check` → `pytest`.
  3. Build thử 2 Docker image (không push).
- **`cd.yml`** – chạy khi push lên `main` hoặc tạo tag `v*` (vd `v1.0.0`): chạy lại toàn bộ CI, sau đó build và đẩy image lên GitHub Container Registry:
  - `ghcr.io/<owner>/<repo>-backend`
  - `ghcr.io/<owner>/<repo>-frontend`

  Tag image: tên nhánh, `sha-<commit>`, `latest` (nhánh mặc định) và số phiên bản khi push tag.

Thiết lập trên GitHub:
1. Đẩy code lên một repository GitHub (thư mục hiện chưa phải git repo: `git init`, commit, `git remote add origin …`, `git push -u origin main`).
2. **Settings → Actions → General → Workflow permissions**: chọn *Read and write* (để push image lên GHCR).
3. (Tuỳ chọn) **Settings → Secrets and variables → Actions → Variables**: thêm `VITE_API_BASE_URL` = địa chỉ backend thật; giá trị này được nhúng vào bundle frontend lúc build (mặc định `http://localhost:8000`).
4. Trên server: `docker pull` hai image, chạy backend với `ZOOGUIDE_SECRET_KEY`, `ZOOGUIDE_CORS_ORIGINS` (địa chỉ frontend) và một volume gắn vào `/data` để giữ dữ liệu.

## Thay đổi so với bản trước

- **Thêm backend** `backend/main.py` (FastAPI) thay cho mock; dữ liệu mẫu chuyển từ `src/data/*.js` sang `backend/seed.json`.
- **Frontend gọi backend thật**: xóa `src/data/`, `services/mockDb.js`, biến `VITE_USE_MOCK`; `api.js` và `chatService.js` chỉ còn các lời gọi HTTP; logic chatbot chuyển lên backend.
- **Bỏ phần audio**: xóa `AudioPlayer`, trang *Admin → Audio thuyết minh*, hàm `uploadAudio`, các trường `audioUrl`/`audioDuration` và CSS liên quan. Dashboard thay "Lượt nghe thuyết minh" bằng số đánh giá + điểm trung bình, và biểu đồ "Số động vật theo khu vực".
- `AnimalCard` hiển thị tên khu từ trường `zoneName` do backend trả về (không import dữ liệu khu vực tĩnh).
- Trang *Cài đặt* đọc/ghi thật qua API và hiển thị trạng thái kết nối backend.
- `npm run dev` chạy song song backend + frontend (`concurrently`).
- Thêm ESLint (`npm run lint`), Dockerfile cho frontend/backend, `docker-compose.yml`, workflow CI/CD.

## Các điểm mở rộng

- **Cơ sở dữ liệu thật**: thay lớp `JsonStore` trong `main.py` bằng SQLite/PostgreSQL (SQLModel/SQLAlchemy); các endpoint giữ nguyên.
- **QR thật**: `npm i html5-qrcode`, khởi tạo scanner trong `components/qr/QRScannerView.jsx` vào phần tử `#qr-reader`, gọi `onScan(text)`. Ảnh QR thật: `npm i qrcode.react` thay `QRCodePreview`.
- **Bản đồ thật**: viết `LeafletZooMap` với cùng props `points, zones, selectedId, onSelect, route` rồi thay trong `pages/Map.jsx`; thêm `lat/lng` cho điểm trong `backend/seed.json`.
- **Chatbot AI**: thay hàm `chat_answer` trong `main.py` bằng lời gọi mô hình ngôn ngữ; frontend không cần sửa.
- **Biểu đồ**: `BarChart`/`LineChart` là SVG đơn giản, có thể thay bằng Recharts.
- **Đa ngôn ngữ**: `LanguageContext` + `utils/translations.js`, có thể thay bằng react-i18next.

## Ghi chú

- Ảnh động vật dùng link Unsplash; nếu ảnh lỗi, `ImageWithFallback` hiển thị nền màu kèm emoji.
- Yêu thích lưu ở `localStorage` của trình duyệt.
- Lưu trữ JSON chỉ phù hợp chạy local/demo (một tiến trình). Khi triển khai nhiều instance hãy chuyển sang cơ sở dữ liệu.
