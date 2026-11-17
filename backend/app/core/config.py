"""Tầng core – cấu hình đọc từ biến môi trường; có giá trị mặc định để chạy thử ở máy cá nhân."""
import os
from pathlib import Path

# Đường dẫn CSDL SQLite (file trong app/database/). "+aiosqlite" = driver bất đồng bộ để dùng async/await
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app/database/zoo.db")

# Khóa ký JWT – BẮT BUỘC đổi khi triển khai thật (đặt biến môi trường SECRET_KEY)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-zooguide-seminar-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 giờ (PRD mục 9)

# Tài khoản admin DUY NHẤT, tạo lúc khởi động nếu chưa có (không có đăng ký). Giá trị mặc định chỉ để chạy thử:
# khi triển khai thật phải đặt biến môi trường ADMIN_EMAIL, ADMIN_PASSWORD (>= 8 ký tự).
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@zooguide.vn")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin12345")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Quản trị viên")

# Frontend được phép gọi API (CORS), cách nhau dấu phẩy
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

# File tĩnh: app/static/uploads/ (ảnh), app/static/audio/ (mp3 đã lưu, khách nghe được) -> URL /static/...
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
AUDIO_DIR = STATIC_DIR / "audio"
# File âm thanh NHÁP nằm NGOÀI static: khách không mở được, admin nghe thử qua API có token
DRAFT_DIR = Path(__file__).resolve().parent.parent / "audio_drafts"
DRAFT_MAX_AGE_SECONDS = 3600  # file nháp không được lưu sẽ bị dọn sau 1 giờ
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(2 * 1024 * 1024)))  # tối đa 2 MB / ảnh

# Giọng đọc edge-tts theo ngôn ngữ (PRD mục 6.6) và mã ngôn ngữ của Google Translate
TTS_VOICES = {"vi": "vi-VN-HoaiMyNeural", "en": "en-US-JennyNeural", "zh": "zh-CN-XiaoxiaoNeural"}
TRANSLATE_CODES = {"vi": "vi", "en": "en", "zh": "zh-CN"}
