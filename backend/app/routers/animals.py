"""Tầng router – nhóm API ĐỘNG VẬT (/api/animals). Router mỏng: nhận request, kiểm tra quyền, gọi animal_service.

Mọi endpoint là async def vì đều chờ I/O (truy vấn SQLite, đọc file upload).
"""
from typing import Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_optional_admin, require_admin
from app.schemas.animals import (
    AnimalAdminResponse,
    AnimalCreate,
    AnimalListItem,
    AnimalPage,
    AnimalUpdate,
    AnimalWithTranslationResponse,
)
from app.services import animal_service

router = APIRouter(prefix="/api/animals", tags=["Animals"])

# --- Guest (công khai; admin gửi token thì thấy thêm động vật đang ẩn) ---
@router.get("", response_model=AnimalPage)
async def list_animals(
    q: str | None = Query(None, description="Tìm theo tên hoặc tên khoa học"),
    category_id: int | None = Query(None, description="Lọc theo nhóm"),
    zone_id: int | None = Query(None, description="Lọc theo khu vực"),
    sort: Literal["name", "popular", "newest"] = Query("name", description="Sắp xếp"),
    lang: str | None = Query(None, description="vi | en | zh; bỏ trống = ngôn ngữ mặc định"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    viewer=Depends(get_optional_admin),
):
    """UC01 – danh sách động vật: tìm, lọc, sắp xếp, phân trang. Khách chỉ thấy động vật đang hiển thị;
    admin (gửi token) thấy cả động vật đang ẩn (UC06 bước 2)."""
    return await animal_service.search_animals(db, q, category_id, zone_id, sort, lang, page, size,
                                         include_hidden=viewer is not None)


@router.get("/{animal_id}", response_model=AnimalWithTranslationResponse)
async def get_animal(
    animal_id: int,
    lang: str | None = Query(None, description="vi | en | zh; bỏ trống = ngôn ngữ mặc định"),
    db: AsyncSession = Depends(get_db),
    viewer=Depends(get_optional_admin),
):
    """UC01 bước 6 – chi tiết động vật theo ngôn ngữ. 404 nếu không có hoặc đang ẩn (admin vẫn xem được)."""
    return await animal_service.get_animal(db, animal_id, lang, include_hidden=viewer is not None)


@router.get("/{animal_id}/related", response_model=list[AnimalListItem])
async def get_related_animals(
    animal_id: int,
    lang: str | None = Query(None, description="vi | en | zh; bỏ trống = ngôn ngữ mặc định"),
    limit: int = Query(4, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """UC01 bước 6 – động vật liên quan (cùng nhóm hoặc cùng khu vực), chỉ động vật đang hiển thị."""
    return await animal_service.get_related(db, animal_id, lang, limit)


# --- Admin ---
@router.get("/{animal_id}/admin", response_model=AnimalAdminResponse)
async def get_animal_admin(
    animal_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """UC06 – động vật kèm MỌI bản dịch để sửa trong form 3 tab (kể cả đang ẩn)."""
    return await animal_service.get_animal_admin(db, animal_id)


@router.post("", response_model=AnimalAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_animal(
    data: AnimalCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """UC06 – thêm động vật kèm bản dịch. 404 khu vực/nhóm/mức bảo tồn sai, 409 trùng tên."""
    return await animal_service.create_animal(db, data)


@router.patch("/{animal_id}", response_model=AnimalAdminResponse)
async def update_animal(
    animal_id: int,
    data: AnimalUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """UC06 – sửa một phần động vật; ẩn/hiện bằng {"available": false|true}."""
    return await animal_service.update_animal(db, animal_id, data)


@router.post("/{animal_id}/image", response_model=AnimalAdminResponse)
async def upload_animal_image(
    animal_id: int,
    file: UploadFile = File(..., description="Ảnh JPEG/PNG/WEBP/GIF, tối đa 2 MB"),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """UC06 – tải ảnh động vật (multipart/form-data, field `file`). 404 không có động vật, 422 ảnh không hợp lệ."""
    return await animal_service.upload_image(db, animal_id, file)


@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_animal(
    animal_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """UC06 A2 – xóa động vật (bản dịch xóa theo). 409 nếu động vật còn POI."""
    await animal_service.delete_animal(db, animal_id)
