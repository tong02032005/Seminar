"""Tầng repository – các câu đếm cho trang Tổng quan (UC09). Chỉ đọc; đếm trực tiếp, không lưu sẵn."""
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.animal import Animal, AnimalTranslation
from app.models.base import Base
from app.models.page_view import PageView
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


# ----- LƯỢT TRUY CẬP (bảng PAGE_VIEW, giờ lưu UTC) -----

def add_page_view(db: AsyncSession, path: str, visitor_id: str) -> None:
    db.add(PageView(path=path, visitor_id=visitor_id))


async def count_views(db: AsyncSession, since: datetime | None = None) -> tuple[int, int]:
    """(số lượt xem, số khách khác nhau) từ thời điểm since (UTC); None = toàn bộ."""
    query = select(func.count(), func.count(PageView.visitor_id.distinct()))
    if since:
        query = query.where(PageView.created_at >= since)
    views, visitors = (await db.execute(query)).one()
    return views, visitors


async def daily_views(db: AsyncSession, since: datetime, offset: str) -> list:
    """Mỗi ngày (theo giờ địa phương, offset dạng '+7 hours'): (ngày 'YYYY-MM-DD', lượt xem, số khách)."""
    day = func.date(PageView.created_at, offset)
    query = (select(day, func.count(), func.count(PageView.visitor_id.distinct()))
             .where(PageView.created_at >= since).group_by(day))
    return (await db.execute(query)).all()


async def top_pages(db: AsyncSession, limit: int) -> list:
    """Các trang được xem nhiều nhất: (path, lượt xem)."""
    views = func.count().label("views")
    query = select(PageView.path, views).group_by(PageView.path).order_by(views.desc(), PageView.path).limit(limit)
    return (await db.execute(query)).all()


async def animal_names(db: AsyncSession, ids: list[int], lang: str) -> dict[int, str]:
    rows = await db.execute(select(AnimalTranslation.animal_id, AnimalTranslation.name)
                            .where(AnimalTranslation.animal_id.in_(ids), AnimalTranslation.lang == lang))
    return dict(rows.all())
