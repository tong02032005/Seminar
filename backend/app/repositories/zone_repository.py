"""Tầng repository – bảng ZONE và ZONE_CONTENT (async). Không commit, không quy tắc nghiệp vụ."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.animal import Animal
from app.models.zone import Zone, ZoneContent


async def get(db: AsyncSession, zone_id: int) -> Zone | None:
    return await db.get(Zone, zone_id)


async def list_zones(db: AsyncSession, lang: str, default_lang: str,
                     zone_id: int | None = None) -> list[tuple[Zone, ZoneContent | None]]:
    """Khu vực kèm nội dung: ngôn ngữ đang chọn, thiếu thì ngôn ngữ mặc định. zone_id: chỉ lấy 1 khu."""
    tr = aliased(ZoneContent)
    tr_def = aliased(ZoneContent)
    stmt = (select(Zone, tr, tr_def)
            .outerjoin(tr, (tr.zone_id == Zone.id) & (tr.lang == lang))
            .outerjoin(tr_def, (tr_def.zone_id == Zone.id) & (tr_def.lang == default_lang))
            .order_by(Zone.id))
    if zone_id is not None:
        stmt = stmt.where(Zone.id == zone_id)
    return [(zone, t or t_def) for zone, t, t_def in (await db.execute(stmt)).all()]


async def animal_counts(db: AsyncSession, include_hidden: bool) -> dict[int, int]:
    """{zone_id: số động vật}; khách chỉ đếm động vật đang hiện."""
    stmt = select(Animal.zone_id, func.count()).group_by(Animal.zone_id)
    if not include_hidden:
        stmt = stmt.where(Animal.available.is_(True))
    return dict((await db.execute(stmt)).all())


async def count_animals(db: AsyncSession, zone_id: int) -> int:
    """Số động vật (kể cả đang ẩn) thuộc khu – dùng trước khi xóa khu (RESTRICT)."""
    return await db.scalar(select(func.count()).select_from(Animal).where(Animal.zone_id == zone_id))


async def list_contents(db: AsyncSession, zone_id: int) -> list[ZoneContent]:
    return list(await db.scalars(select(ZoneContent).where(ZoneContent.zone_id == zone_id)))


async def exists_name(db: AsyncSession, lang: str, name: str, exclude_id: int | None = None) -> bool:
    """Tên khu đã có trong cùng ngôn ngữ chưa (UNIQUE(lang, name))."""
    stmt = select(ZoneContent.zone_id).where(ZoneContent.lang == lang, ZoneContent.name == name)
    if exclude_id is not None:
        stmt = stmt.where(ZoneContent.zone_id != exclude_id)
    return await db.scalar(stmt.limit(1)) is not None


async def add(db: AsyncSession, zone: Zone, contents: list[ZoneContent]) -> Zone:
    db.add(zone)
    await db.flush()  # chờ CSDL cấp zone.id cho khóa ngoại của nội dung
    for content in contents:
        content.zone_id = zone.id
    db.add_all(contents)
    await db.flush()
    return zone


async def upsert_contents(db: AsyncSession, zone_id: int, contents: list[ZoneContent]) -> None:
    """Thêm hoặc thay nội dung theo từng ngôn ngữ; ngôn ngữ không gửi giữ nguyên."""
    for content in contents:
        content.zone_id = zone_id
        await db.merge(content)
    await db.flush()


async def delete(db: AsyncSession, zone: Zone) -> None:
    """Xóa khu; ZONE_CONTENT tự xóa theo (CASCADE). Còn động vật thì CSDL chặn (RESTRICT)."""
    await db.delete(zone)
    await db.flush()
