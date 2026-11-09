"""Tầng service – nhóm động vật và mức bảo tồn (chỉ đọc, phục vụ bộ lọc và form admin)."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import lookup_repository
from app.services.i18n import default_lang, resolve_lang


async def list_categories(db: AsyncSession, lang: str | None = None) -> list[dict]:
    """Nhóm động vật theo ngôn ngữ (thiếu bản dịch thì dùng mã nhóm làm tên)."""
    rows = await lookup_repository.list_categories(db, await resolve_lang(db, lang), await default_lang(db))
    return [{"id": c.id, "code": c.code, "name": name or c.code} for c, name in rows]


async def list_statuses(db: AsyncSession, lang: str | None = None) -> list[dict]:
    """Mức bảo tồn IUCN theo ngôn ngữ."""
    rows = await lookup_repository.list_statuses(db, await resolve_lang(db, lang), await default_lang(db))
    return [{"code": s.code, "name": name or s.code, "color": s.color} for s, name in rows]
