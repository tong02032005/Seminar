"""Tầng service – UC05 Đăng nhập / đăng xuất (kèm Đổi mật khẩu) của admin.

Đăng xuất không cần service: JWT không lưu trên server nên frontend tự xóa token.
"""
from datetime import datetime, timezone

from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthError, BusinessRuleError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.admin_account import AdminAccount
from app.schemas.auth import ChangePasswordRequest, LoginRequest


async def login(db: AsyncSession, data: LoginRequest) -> str:
    """UC05 bước 4–5 – kiểm tra email + mật khẩu, trả JWT (8 giờ).
    Sai -> 401 với thông báo CHUNG, không nói rõ sai email hay sai mật khẩu (UC05 E1)."""
    admin = await db.scalar(select(AdminAccount).where(AdminAccount.email == data.email.lower()))
    # run_in_threadpool: PBKDF2 600.000 vòng nặng CPU, đẩy sang luồng phụ để không chặn event loop
    if admin is None or not await run_in_threadpool(verify_password, data.password, admin.password_hash):
        raise AuthError("Email hoặc mật khẩu không đúng")
    return create_access_token(admin.id)


async def change_password(db: AsyncSession, admin: AdminAccount, data: ChangePasswordRequest) -> None:
    """UC05 A1 – đổi mật khẩu. Sai mật khẩu cũ -> 400 (UC05 E3). Ghi passwordChangedAt để mọi token cấp
    trước thời điểm này bị từ chối (401), admin phải đăng nhập lại."""
    if not await run_in_threadpool(verify_password, data.old_password, admin.password_hash):
        raise BusinessRuleError("Mật khẩu cũ không đúng")
    admin.password_hash = await run_in_threadpool(hash_password, data.new_password)
    admin.password_changed_at = datetime.now(timezone.utc).replace(tzinfo=None)  # lưu giờ UTC
    await db.commit()
