"""Tầng core – dependency xác thực admin (đọc JWT). Khách không cần token."""
from datetime import timezone

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthError
from app.core.security import decode_access_token
from app.models.admin_account import AdminAccount

# Đọc header "Authorization: Bearer <token>"; auto_error=False để tự trả 401 theo định dạng chung
_bearer = HTTPBearer(auto_error=False)


async def _admin_from_token(db: AsyncSession, token: str) -> AdminAccount:
    """Giải mã JWT rồi lấy admin trong CSDL.

    401 khi: token sai/hết hạn, tài khoản không còn, hoặc token cấp TRƯỚC lần đổi mật khẩu gần nhất (UC05 E4).
    """
    admin_id, issued_at = decode_access_token(token)
    admin = await db.get(AdminAccount, admin_id)
    if admin is None:
        raise AuthError("Tài khoản không tồn tại")
    changed = admin.password_changed_at
    # passwordChangedAt lưu giờ UTC không kèm múi giờ -> gắn UTC rồi so với thời điểm cấp token
    if changed is not None and issued_at < changed.replace(tzinfo=timezone.utc).timestamp():
        raise AuthError("Mật khẩu đã đổi, hãy đăng nhập lại")
    return admin


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> AdminAccount:
    """Dependency cho mọi API quản trị: thiếu/sai token -> 401."""
    if credentials is None:
        raise AuthError("Chưa đăng nhập")
    return await _admin_from_token(db, credentials.credentials)


async def get_optional_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> AdminAccount | None:
    """API công khai mà admin được xem thêm (động vật/POI đang ẩn, ngôn ngữ đang tắt).
    Không gửi token -> None (khách). Gửi token thì kiểm tra như require_admin."""
    if credentials is None:
        return None
    return await _admin_from_token(db, credentials.credentials)
