"""Tầng schema – đăng nhập, thông tin admin, đổi mật khẩu."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class LoginRequest(BaseModel):
    email: EmailStr  # sai định dạng -> 422 (UC05 E2)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    token: str  # JWT, hết hạn sau 8 giờ


class AdminOut(BaseModel):
    id: int
    full_name: str
    email: str
    password_changed_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChangePasswordRequest(BaseModel):
    """PATCH /api/auth/password. Mật khẩu mới < 8 ký tự hoặc xác nhận không khớp -> 422 (UC05 E3)."""
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def _match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Mật khẩu xác nhận không khớp")
        return self
