"""Tầng repository – bảng POI và POI_CONTENT (async). Không commit, không quy tắc nghiệp vụ."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.animal import Animal, AnimalTranslation
from app.models.poi import Poi, PoiContent


async def get(db: AsyncSession, poi_id: int) -> Poi | None:
    return await db.get(Poi, poi_id)


async def get_by_animal(db: AsyncSession, animal_id: int) -> Poi | None:
    return await db.scalar(select(Poi).where(Poi.animal_id == animal_id))


async def animal_ids_with_poi(db: AsyncSession) -> set[int]:
    return set(await db.scalars(select(Poi.animal_id)))


async def list_with_animal(db: AsyncSession, include_hidden: bool = False, zone_id: int | None = None,
                           poi_id: int | None = None) -> list[tuple[Poi, Animal]]:
    """POI kèm động vật của nó. Khách: chỉ POI của động vật đang hiện. zone_id: lọc theo khu của động vật."""
    stmt = select(Poi, Animal).join(Animal, Animal.id == Poi.animal_id).order_by(Poi.id)
    if not include_hidden:
        stmt = stmt.where(Animal.available.is_(True))
    if zone_id is not None:
        stmt = stmt.where(Animal.zone_id == zone_id)
    if poi_id is not None:
        stmt = stmt.where(Poi.id == poi_id)
    return list((await db.execute(stmt)).all())


async def contents_by_poi(db: AsyncSession, poi_ids: list[int]) -> dict[int, dict[str, PoiContent]]:
    """{poi_id: {lang: nội dung}} cho nhiều POI trong 1 câu truy vấn."""
    result: dict[int, dict[str, PoiContent]] = {pid: {} for pid in poi_ids}
    if poi_ids:
        for content in await db.scalars(select(PoiContent).where(PoiContent.poi_id.in_(poi_ids))):
            result[content.poi_id][content.lang] = content
    return result


async def get_content(db: AsyncSession, poi_id: int, lang: str) -> PoiContent | None:
    return await db.get(PoiContent, (poi_id, lang))


async def animal_names(db: AsyncSession, animal_ids: list[int], lang: str, default_lang: str) -> dict[int, str]:
    """{animal_id: tên} theo ngôn ngữ đang chọn, thiếu thì ngôn ngữ mặc định."""
    names: dict[int, str] = {}
    if animal_ids:
        rows = await db.execute(select(AnimalTranslation.animal_id, AnimalTranslation.lang, AnimalTranslation.name)
                                .where(AnimalTranslation.animal_id.in_(animal_ids),
                                       AnimalTranslation.lang.in_((lang, default_lang))))
        for animal_id, row_lang, name in rows:
            if row_lang == lang or animal_id not in names:
                names[animal_id] = name
    return names


async def add(db: AsyncSession, poi: Poi, contents: list[PoiContent]) -> Poi:
    db.add(poi)
    await db.flush()  # chờ CSDL cấp poi.id cho khóa ngoại của nội dung
    for content in contents:
        content.poi_id = poi.id
    db.add_all(contents)
    await db.flush()
    return poi


async def delete(db: AsyncSession, poi: Poi) -> None:
    """Xóa POI; POI_CONTENT tự xóa theo (CASCADE). File âm thanh do service xóa."""
    await db.delete(poi)
    await db.flush()
