"""Tầng repository – các bảng tra cứu: LANGUAGE, CATEGORY, CONSERVATION_STATUS (+ bản dịch) và tên khu vực (async)."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.category import Category, CategoryTranslation
from app.models.conservation_status import ConservationStatus, ConservationStatusTranslation
from app.models.language import Language
from app.models.zone import Zone, ZoneContent


async def get_language(db: AsyncSession, code: str) -> Language | None:
    """Lấy ngôn ngữ theo mã (vi, en, zh); không có -> None."""
    return await db.get(Language, code)


async def list_languages(db: AsyncSession, only_active: bool = False) -> list[Language]:
    """Danh sách ngôn ngữ theo thứ tự vi, en, zh (sắp theo mã nhưng vi lên đầu)."""
    stmt = select(Language)
    if only_active:
        stmt = stmt.where(Language.is_active.is_(True))
    languages = list(await db.scalars(stmt))
    return sorted(languages, key=lambda lang: ("vi", "en", "zh").index(lang.code) if lang.code in ("vi", "en", "zh") else 9)


async def category_exists(db: AsyncSession, category_id: int) -> bool:
    return await db.get(Category, category_id) is not None


async def status_exists(db: AsyncSession, code: str) -> bool:
    return await db.get(ConservationStatus, code) is not None


async def _names(db: AsyncSession, model, key_col, name_col, lang_col, lang: str, default_lang: str) -> dict:
    """{khóa: tên} theo ngôn ngữ đang chọn, thiếu thì ngôn ngữ mặc định (2 câu truy vấn nhỏ, bảng ít dòng)."""
    rows = (await db.execute(select(key_col, lang_col, name_col).where(lang_col.in_((lang, default_lang))))).all()
    names: dict = {}
    for key, row_lang, name in rows:
        if row_lang == lang or key not in names:
            names[key] = name
    return names


async def category_names(db: AsyncSession, lang: str, default_lang: str) -> dict[int, str]:
    return await _names(db, CategoryTranslation, CategoryTranslation.category_id, CategoryTranslation.name,
                        CategoryTranslation.lang, lang, default_lang)


async def zone_names(db: AsyncSession, lang: str, default_lang: str) -> dict[int, str]:
    return await _names(db, ZoneContent, ZoneContent.zone_id, ZoneContent.name, ZoneContent.lang, lang, default_lang)


async def list_categories(db: AsyncSession, lang: str, default_lang: str) -> list[tuple[Category, str | None]]:
    names = await category_names(db, lang, default_lang)
    return [(c, names.get(c.id)) for c in await db.scalars(select(Category).order_by(Category.id))]


async def list_statuses(db: AsyncSession, lang: str, default_lang: str) -> list[tuple[ConservationStatus, str | None]]:
    """Mức bảo tồn theo thứ tự IUCN (EX -> NE) kèm tên theo ngôn ngữ."""
    tr = aliased(ConservationStatusTranslation)
    tr_def = aliased(ConservationStatusTranslation)
    rows = (await db.execute(
        select(ConservationStatus, tr.name, tr_def.name)
        .outerjoin(tr, (tr.status_code == ConservationStatus.code) & (tr.lang == lang))
        .outerjoin(tr_def, (tr_def.status_code == ConservationStatus.code) & (tr_def.lang == default_lang))
    )).all()
    order = ("EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE")
    return sorted(((s, n or n_def) for s, n, n_def in rows), key=lambda r: order.index(r[0].code))


async def zone_exists(db: AsyncSession, zone_id: int) -> bool:
    return await db.get(Zone, zone_id) is not None
