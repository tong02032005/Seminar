"""Tầng model – bảng PAGE_VIEW: mỗi lần khách mở một trang là một dòng (thống kê người dùng)."""
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PageView(Base):
    __tablename__ = "page_view"
    __table_args__ = ({"sqlite_autoincrement": True},)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    path: Mapped[str] = mapped_column(String(200), nullable=False)
    # Mã ngẫu nhiên trình duyệt tự tạo và lưu localStorage: cùng mã = cùng một khách
    visitor_id: Mapped[str] = mapped_column("visitorId", String(64), nullable=False)
    # Giờ UTC
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), index=True
    )
