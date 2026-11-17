"""Tầng model – bảng POI (đổi từ MAP_POINT) và POI_CONTENT (đổi từ MAP_POINT_TRANSLATION).

POI = vị trí chuồng của MỘT động vật (1–1: animalId NOT NULL UNIQUE, RESTRICT).
POI_CONTENT = tên chuồng, chỉ dẫn, lời thuyết minh và file âm thanh theo từng ngôn ngữ.
"""
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Poi(Base):
    __tablename__ = "poi"
    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_poi_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_poi_longitude"),
        {"sqlite_autoincrement": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    animal_id: Mapped[int] = mapped_column(
        "animalId", Integer, ForeignKey("animal.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    icon: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 4), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 4), nullable=False)


class PoiContent(Base):
    __tablename__ = "poi_content"
    __table_args__ = (
        CheckConstraint("narrationSource IN ('manual', 'auto')", name="ck_poi_content_narration_source"),
    )

    poi_id: Mapped[int] = mapped_column(
        "poiId", Integer, ForeignKey("poi.id", ondelete="CASCADE"), primary_key=True, nullable=False
    )
    lang: Mapped[str] = mapped_column(
        String(10), ForeignKey("language.code", ondelete="RESTRICT"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # vd "Chuồng hổ Bengal"
    direction: Mapped[str | None] = mapped_column(Text)  # chỉ dẫn đường đi
    narration: Mapped[str | None] = mapped_column(Text)  # lời thuyết minh dạng chữ
    # manual = admin tự viết, auto = do hệ thống tự dịch
    narration_source: Mapped[str] = mapped_column(
        "narrationSource", String(10), nullable=False, server_default=text("'manual'")
    )
    # Đường dẫn mp3 đã được admin nghe thử và bấm Lưu; NULL = chưa có âm thanh. File nháp không bao giờ ghi vào đây.
    audio_file: Mapped[str | None] = mapped_column("audioFile", String(255))
