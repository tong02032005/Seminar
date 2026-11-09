# ZooGuide – Backend (Seminar)

API cho web thuyết minh sở thú đa ngôn ngữ (Tiếng Việt, English, 中文).
Khách không cần đăng nhập; chỉ quản trị viên đăng nhập để quản lý động vật, khu vực, POI và thuyết minh.

Công nghệ: FastAPI · SQLAlchemy 2.0 (async, aiosqlite) · SQLite · Alembic · Pydantic v2 · PyJWT · pytest ·
deep-translator (nút **Dịch**) · edge-tts (nút **Tạo âm thanh**). Hai dịch vụ này miễn phí, không cần key, nhưng **cần Internet**.

## Chạy trên Windows (PowerShell hoặc CMD, đứng trong thư mục `backend`)

```bash
python -m venv .venv
.venv\Scripts\activate                    # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m alembic upgrade head            # tạo 13 bảng trong app/database/zoo.db
python -m app.core.sample_data            # (nên chạy) nạp 5 khu vực, 18 động vật, 16 POI mẫu + tải ảnh còn thiếu từ Wikipedia
python -m uvicorn app.main:app --reload
```

- Tài liệu API: http://127.0.0.1:8000/docs
- Tài khoản quản trị mặc định: **admin@zooguide.vn / admin12345** (tạo tự động lần chạy đầu; đổi được trong trang quản trị).
- Muốn đổi email/mật khẩu ban đầu, tên miền frontend… thì đặt biến môi trường trước khi chạy lần đầu:
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `SECRET_KEY`, `CORS_ORIGINS` (mặc định cho phép http://localhost:5173).
- CSDL đã có từ trước, muốn cập nhật mô tả 9 mục và lời thuyết minh (20–30 giây) 3 ngôn ngữ cho 18 động vật mẫu (ghi đè bản cũ; lời đổi thì âm thanh cũ bị xóa):
  `python -m app.core.sample_data --update`. Nội dung nằm trong `app/core/animal_details.py` và `app/core/narrations.py`.
- Muốn làm lại dữ liệu từ đầu: xóa `app/database/zoo.db`, chạy lại 2 lệnh alembic và sample_data.

## Chạy test

```bash
python -m pytest -q        # 36 test; Dịch và Tạo âm thanh được giả lập nên không cần Internet
```

## Cấu trúc

```
app/
  main.py            khởi tạo FastAPI, CORS, phục vụ /static (ảnh, mp3)
  core/              config, bảo mật (JWT, băm mật khẩu), lỗi, seed, sample_data
  models/            bảng SQLAlchemy: admin_account, animal(+translation), category, conservation_status,
                     language, zone(+zone_content), poi(+poi_content), settings
  schemas/           dữ liệu vào/ra (Pydantic)
  repositories/      truy vấn CSDL
  services/          nghiệp vụ (poi_service: thuyết minh + âm thanh, narration_service: gọi dịch/TTS)
  routers/           endpoint: auth, animals, zone, pois, categories, systems
  static/            ảnh tải lên và file mp3 đã lưu (khách nghe được)
  audio_drafts/      file mp3 nháp (chỉ admin nghe thử, tự xóa sau 1 giờ)
alembic/             migration gốc e55cb57b86f9 (13 bảng theo schema.sql)
tests/
```

## Luồng thuyết minh (UC08)

1. Admin nhập lời thuyết minh ở 1 ngôn ngữ, bấm **Dịch** (`POST /api/translate`) để điền 2 ngôn ngữ còn lại, sửa nếu cần rồi **Lưu POI**.
2. **Tạo âm thanh** (`POST /api/pois/{id}/audio/preview?lang=`) tạo file nháp từ lời đã lưu; admin nghe thử
   (`GET /api/pois/{id}/audio/preview/{draft_id}`, cần token).
3. **Lưu âm thanh** (`PUT /api/pois/{id}/audio?lang=`) chuyển file nháp thành file chính; lúc này khách mới nghe được.
4. Sửa lời thuyết minh của ngôn ngữ nào thì file âm thanh của ngôn ngữ đó bị xóa, phải tạo lại.

Không có mạng hoặc dịch vụ lỗi → API trả 503 với thông báo tiếng Việt, dữ liệu không bị thay đổi.
