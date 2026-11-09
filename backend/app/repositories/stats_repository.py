"""Tầng repository – các câu đếm cho trang Tổng quan (UC09). Chỉ đọc; đếm trực tiếp, không lưu sẵn."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.animal import Animal
from app.models.base import Base
from app.models.poi import Poi, PoiContent


async def count_all(db: AsyncSession, model: type[Base]) -> int:
    """Đếm số dòng của một bảng bằng COUNT(*)."""
    return await db.scalar(select(func.count()).select_from(model))


async def count_visible_animals(db: AsyncSession) -> int:
    return await db.scalar(select(func.count()).select_from(Animal).where(Animal.available.is_(True)))


async def count_animals_without_poi(db: AsyncSession) -> int:
    return await db.scalar(select(func.count()).select_from(Animal)
                           .where(~Animal.id.in_(select(Poi.animal_id))))


async def count_pois_with(db: AsyncSession, lang: str, column) -> int:
    """Số POI có nội dung ngôn ngữ lang mà cột (narration / audioFile) khác rỗng."""
    return await db.scalar(select(func.count()).select_from(PoiContent)
                           .where(PoiContent.lang == lang, column.is_not(None), column != ""))
