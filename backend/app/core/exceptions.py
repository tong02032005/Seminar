"""Exception nghiệp vụ: service raise, main.py đổi thành HTTP response {"detail": message}."""


class AppError(Exception):
    """Lớp cha của mọi lỗi nghiệp vụ; status_code là mã HTTP trả về."""

    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BusinessRuleError(AppError):
    """400 – vi phạm quy tắc nghiệp vụ (sai mật khẩu cũ, tắt ngôn ngữ mặc định...)."""
    status_code = 400


class AuthError(AppError):
    """401 – sai email/mật khẩu, thiếu token, token sai / hết hạn / cấp trước lần đổi mật khẩu."""
    status_code = 401


class NotFoundError(AppError):
    """404 – không tìm thấy bản ghi."""
    status_code = 404


class ConflictError(AppError):
    """409 – trùng dữ liệu hoặc vướng ràng buộc khóa ngoại (xóa động vật còn POI, khu còn động vật)."""
    status_code = 409


class InvalidDataError(AppError):
    """422 – dữ liệu thiếu mà phải tra CSDL mới biết (thiếu nội dung ở ngôn ngữ mặc định, thuyết minh trống)."""
    status_code = 422


class ServiceUnavailableError(AppError):
    """503 – dịch vụ dịch hoặc giọng đọc bên ngoài không phản hồi."""
    status_code = 503
