# ZooGuide – Frontend (Seminar)

Web thuyết minh sở thú: khách xem động vật, khu vực, bản đồ, nghe thuyết minh bằng Tiếng Việt / English / 中文
(không cần đăng nhập). Quản trị viên vào `/admin` để quản lý.

React 18 · Vite · React Router 6 · lucide-react. Không dùng thư viện UI hay bản đồ ngoài.

## Chạy (đứng trong thư mục `frontend`, cần Node.js 18+)

```bash
npm install
npm run dev
```

Mở http://localhost:5173. Backend phải đang chạy ở http://localhost:8000 (xem `../backend/README.md`).
Địa chỉ backend đặt trong file `.env` (`VITE_API_BASE_URL`), mẫu ở `.env.example`.

- Trang quản trị: http://localhost:5173/admin — **admin@zooguide.vn / admin12345**
- Kiểm tra code: `npm run lint` · build bản chạy thật: `npm run build`

## Bản tĩnh cho điện thoại (không cần server)

Bản chỉ có phần khách xem (trang chủ, động vật, khu vực, bản đồ, nghe thuyết minh, đổi ngôn ngữ), không có admin.
Dữ liệu là ảnh chụp tại thời điểm xuất: sửa dữ liệu trong admin xong thì xuất và tải lên lại.

1. Thư mục `backend` (đã bật `.venv`): `python -m app.core.export_static` → tạo `frontend/static-site/` (JSON + ảnh + mp3)
2. Thư mục `frontend`: `npm run build:static` → thư mục `dist-static/`
3. Xem thử trên máy: `npm run preview:static` (mở http://localhost:4173)
4. Đưa **nội dung** thư mục `dist-static/` lên GitHub Pages hoặc Netlify (hướng dẫn chi tiết ở tab "Mobile" trong Docs seminar).

Bản tĩnh dùng đường dẫn dạng `#/animals` nên chạy được ở bất kỳ thư mục con nào, không cần cấu hình server.

## Các trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ, động vật nổi bật, khu vực |
| `/animals`, `/animals/:id` | Tìm, lọc, xem chi tiết động vật + nghe thuyết minh |
| `/zones`, `/zones/:id` | Khu vực và động vật trong khu |
| `/map` | Bản đồ POI, bấm điểm để xem chỉ đường, nghe thuyết minh |
| `/admin` | Tổng quan (thống kê) |
| `/admin/animals` | Thêm/sửa/ẩn/xóa động vật, nội dung 3 ngôn ngữ, ảnh |
| `/admin/zones` | Thêm/sửa/xóa khu vực |
| `/admin/pois` | POI, lời thuyết minh, Dịch, Tạo âm thanh → nghe thử → Lưu âm thanh |
| `/admin/settings` | Tên sở thú, giờ mở cửa, hotline, ngôn ngữ mặc định, bật/tắt ngôn ngữ |
| `/admin/password` | Đổi mật khẩu |

## Cấu trúc `src/`

```
services/   api.js (mọi lời gọi backend), httpClient.js, config.js, tokenStorage.js
context/    LanguageContext (ngôn ngữ khách), AuthContext (đăng nhập admin), ToastContext
pages/      trang khách; pages/admin/ trang quản trị
components/ layout, common, animals, zones, map, admin (form modal 3 tab ngôn ngữ)
utils/      translations.js (chữ giao diện vi/en/zh), format.js, validators.js
styles/     CSS thuần; seminar.css là phần bổ sung cho bản Seminar
```
