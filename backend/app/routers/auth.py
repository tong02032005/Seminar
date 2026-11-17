"""Tầng router – nhóm API XÁC THỰC ADMIN (/api/auth): đăng nhập, đăng xuất, thông tin admin, đổi mật khẩu (UC05)."""
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.auth import AdminOut, ChangePasswordRequest, LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """UC05 – đăng nhập admin, trả JWT (8 giờ). 401 sai email/mật khẩu, 422 sai định dạng."""
    return TokenResponse(token=await auth_service.login(db, data))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(admin=Depends(require_admin)):
    """UC05 – đăng xuất: trả 204. JWT không lưu trên server, frontend tự xóa token."""
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=AdminOut)
async def me(admin=Depends(require_admin)):
    """Thông tin admin đang đăng nhập (frontend dùng để kiểm tra token còn hợp lệ)."""
    return admin


@router.patch("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(data: ChangePasswordRequest, admin=Depends(require_admin),
                          db: AsyncSession = Depends(get_db)):
    """UC05 A1 – đổi mật khẩu. 400 sai mật khẩu cũ; 422 mật khẩu mới < 8 ký tự hoặc xác nhận không khớp.
    Xong thì mọi token cũ bị từ chối (401)."""
    await auth_service.change_password(db, admin, data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
