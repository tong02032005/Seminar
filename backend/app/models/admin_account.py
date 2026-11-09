"""Tầng model – bảng ADMIN_ACCOUNT (đổi từ USER): tài khoản admin duy nhất, tạo từ biến môi trường lúc khởi động."""
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AdminAccount(Base):
    __tablename__ = "admin_account"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column("fullName", String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255), nullable=False)
    # Lần đổi mật khẩu gần nhất (giờ UTC): token cấp TRƯỚC thời điểm này bị từ chối (401)
    password_changed_at: Mapped[datetime | None] = mapped_column("passwordChangedAt", DateTime)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
