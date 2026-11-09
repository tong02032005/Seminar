# Ghi chú cho AI / người sửa code

- Nguồn yêu cầu: PRD + Đặc tả use case + lược đồ CSDL trong Google Doc Seminar. Lược đồ: 13 bảng (schema.sql).
- Kiến trúc: Router → Service → Repository → Model. Router không truy vấn CSDL trực tiếp.
- Lỗi nghiệp vụ: raise lớp con của `AppError` (core/exceptions.py) → `{"detail": "..."}` tiếng Việt.
  400 BusinessRule, 401, 404, 409 Conflict, 422 InvalidData, 503 ServiceUnavailable.
- Chỉ một loại tài khoản (ADMIN_ACCOUNT). Không có đăng ký, quên mật khẩu, đánh giá.
- Đổi mật khẩu cập nhật `password_changed_at`; token có claim `ts` cũ hơn thì bị từ chối (core/deps.py).
- Khách: dùng `get_optional_admin`; không token thì ẩn động vật `available = false` và POI của chúng.
- FK của POI là RESTRICT: xóa động vật đang có POI → 409, phải xóa POI trước.
- Âm thanh chỉ sinh bằng TTS, không có upload mp3. File nháp ở `app/audio_drafts` (ngoài static), file chính ở `app/static/audio`.
- Test giả lập `narration_service.translate/synthesize` (tests/conftest.py); chạy `python -m pytest -q`.
- Thêm cột/bảng: sửa model rồi `python -m alembic revision --autogenerate -m "..."`.
