"""Tầng service – UC02 Xem khu vực (khách) và UC07 Quản lý khu vực (admin)."""
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, ConflictError, InvalidDataError, NotFoundError
from app.models.zone import Zone, ZoneContent
from app.repositories import lookup_repository, zone_repository
from app.schemas.zone import ZoneContentIn, ZoneCreate, ZoneUpdate
from app.services import image_service
from app.services.i18n import default_lang, resolve_lang

_ZONE_FIELDS = ("color", "open_hours", "area_m2", "image")


def _out(zone: Zone, content: ZoneContent | None, count: int) -> dict:
    return {
        "id": zone.id,
        "name": content.name if content else f"Khu {zone.id}",
        "description": content.description if content else None,
        "color": zone.color,
        "open_hours": zone.open_hours,
        "area_m2": float(zone.area_m2) if zone.area_m2 is not None else None,  # Decimal -> số cho JSON
        "image": zone.image,
        "animal_count": count,
    }


async def list_zones(db: AsyncSession, lang: str | None = None, include_hidden: bool = False) -> list[dict]:
    """UC02 bước 2 – danh sách khu theo ngôn ngữ kèm số động vật (khách chỉ đếm động vật đang hiện)."""
    rows = await zone_repository.list_zones(db, await resolve_lang(db, lang), await default_lang(db))
    counts = await zone_repository.animal_counts(db, include_hidden)
    return [_out(zone, content, counts.get(zone.id, 0)) for zone, content in rows]


async def get_zone(db: AsyncSession, zone_id: int, lang: str | None = None, include_hidden: bool = False) -> dict:
    """UC02 bước 4 – chi tiết khu. Không có -> 404 "Không tìm thấy khu vực" (UC02 E1)."""
    rows = await zone_repository.list_zones(db, await resolve_lang(db, lang), await default_lang(db), zone_id)
    if not rows:
        raise NotFoundError("Không tìm thấy khu vực")
    counts = await zone_repository.animal_counts(db, include_hidden)
    return _out(*rows[0], counts.get(zone_id, 0))


async def _get_or_404(db: AsyncSession, zone_id: int) -> Zone:
    zone = await zone_repository.get(db, zone_id)
    if zone is None:
        raise NotFoundError("Không tìm thấy khu vực")
    return zone


async def get_zone_admin(db: AsyncSession, zone_id: int) -> dict:
    """Khu vực + nội dung mọi ngôn ngữ (form sửa 3 tab)."""
    zone = await _get_or_404(db, zone_id)
    data = {field: getattr(zone, field) for field in _ZONE_FIELDS}
    data["area_m2"] = float(zone.area_m2) if zone.area_m2 is not None else None
    data.update(id=zone.id, contents=await zone_repository.list_contents(db, zone.id))
    return data


async def _validate_contents(db: AsyncSession, contents: list[ZoneContentIn], exclude_id: int | None,
                             require_default: bool) -> None:
    """UC07 E2: ngôn ngữ phải tồn tại (400); tên trùng trong cùng ngôn ngữ (409); thiếu tên ở ngôn ngữ mặc định (422)."""
    for content in contents:
        if await lookup_repository.get_language(db, content.lang) is None:
            raise BusinessRuleError(f"Ngôn ngữ '{content.lang}' không được hỗ trợ")
        if await zone_repository.exists_name(db, content.lang, content.name, exclude_id):
            raise ConflictError(f"Tên khu '{content.name}' đã tồn tại")
    default = await default_lang(db)
    if require_default and not any(c.lang == default and c.name.strip() for c in contents):
        raise InvalidDataError(f"Thiếu tên khu ở ngôn ngữ mặc định ({default})")


async def create_zone(db: AsyncSession, data: ZoneCreate) -> dict:
    """UC07 – thêm khu + nội dung trong 1 giao dịch."""
    await _validate_contents(db, data.contents, None, require_default=True)
    zone = await zone_repository.add(db, Zone(**data.model_dump(include=set(_ZONE_FIELDS))),
                                     [ZoneContent(**c.model_dump()) for c in data.contents])
    await db.commit()
    return await get_zone_admin(db, zone.id)


async def update_zone(db: AsyncSession, zone_id: int, data: ZoneUpdate) -> dict:
    """UC07 – sửa một phần; nội dung gửi lên thay bản cùng ngôn ngữ."""
    zone = await _get_or_404(db, zone_id)
    fields = data.model_dump(exclude_unset=True, exclude={"contents"})
    contents = data.contents or []
    await _validate_contents(db, contents, zone_id, require_default=False)
    for field, value in fields.items():
        setattr(zone, field, value)
    if contents:
        await zone_repository.upsert_contents(db, zone_id, [ZoneContent(**c.model_dump()) for c in contents])
    await db.commit()
    return await get_zone_admin(db, zone_id)


async def upload_image(db: AsyncSession, zone_id: int, upload: UploadFile) -> dict:
    zone = await _get_or_404(db, zone_id)
    zone.image = await image_service.save_image(upload, "zones")
    await db.commit()
    return await get_zone_admin(db, zone_id)


async def delete_zone(db: AsyncSession, zone_id: int) -> None:
    """UC07 A1 – xóa khu. Còn động vật -> 409 kèm số lượng (UC07 E3); ZONE_CONTENT xóa theo (CASCADE)."""
    zone = await _get_or_404(db, zone_id)
    count = await zone_repository.count_animals(db, zone_id)
    if count:
        raise ConflictError(f"Khu vực đang có {count} động vật, hãy chuyển chúng sang khu khác hoặc xóa trước")
    await zone_repository.delete(db, zone)
    await db.commit()
