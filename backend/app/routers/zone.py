"""Tầng router – nhóm API KHU VỰC (/api/zones): khách xem (UC02), admin thêm/sửa/xóa (UC07)."""
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_optional_admin, require_admin
from app.schemas.zone import ZoneAdmin, ZoneCreate, ZoneOut, ZoneUpdate
from app.services import zone_service

router = APIRouter(prefix="/api/zones", tags=["Zones"])
_LANG = Query(None, description="vi | en | zh; bỏ trống = ngôn ngữ mặc định")


@router.get("", response_model=list[ZoneOut])
async def list_zones(lang: str | None = _LANG, db: AsyncSession = Depends(get_db), viewer=Depends(get_optional_admin)):
    """UC02 – danh sách khu vực theo ngôn ngữ, kèm số động vật."""
    return await zone_service.list_zones(db, lang, include_hidden=viewer is not None)


@router.get("/{zone_id}", response_model=ZoneOut)
async def get_zone(zone_id: int, lang: str | None = _LANG, db: AsyncSession = Depends(get_db),
                   viewer=Depends(get_optional_admin)):
    """UC02 – chi tiết khu vực. 404 nếu không có."""
    return await zone_service.get_zone(db, zone_id, lang, include_hidden=viewer is not None)


@router.get("/{zone_id}/admin", response_model=ZoneAdmin)
async def get_zone_admin(zone_id: int, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC07 – khu vực kèm nội dung mọi ngôn ngữ (form sửa)."""
    return await zone_service.get_zone_admin(db, zone_id)


@router.post("", response_model=ZoneAdmin, status_code=status.HTTP_201_CREATED)
async def create_zone(data: ZoneCreate, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC07 – thêm khu. 422 sai định dạng / thiếu tên ngôn ngữ mặc định, 409 trùng tên."""
    return await zone_service.create_zone(db, data)


@router.patch("/{zone_id}", response_model=ZoneAdmin)
async def update_zone(zone_id: int, data: ZoneUpdate, db: AsyncSession = Depends(get_db),
                      admin=Depends(require_admin)):
    """UC07 – sửa một phần khu vực."""
    return await zone_service.update_zone(db, zone_id, data)


@router.post("/{zone_id}/image", response_model=ZoneAdmin)
async def upload_zone_image(zone_id: int, file: UploadFile = File(..., description="Ảnh JPEG/PNG/WEBP/GIF, tối đa 2 MB"),
                            db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC07 – tải ảnh khu vực (multipart/form-data, field `file`)."""
    return await zone_service.upload_image(db, zone_id, file)


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_zone(zone_id: int, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC07 A1 – xóa khu. 409 nếu khu còn động vật (kèm số lượng)."""
    await zone_service.delete_zone(db, zone_id)
