"""Tầng router – nhóm động vật và mức bảo tồn (chỉ đọc, công khai, nạp sẵn)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.category import CategoryOut, ConservationStatusOut
from app.services import category_service

router = APIRouter(tags=["Categories"])
_LANG = Query(None, description="vi | en | zh; bỏ trống = ngôn ngữ mặc định")


@router.get("/api/categories", response_model=list[CategoryOut])
async def list_categories(lang: str | None = _LANG, db: AsyncSession = Depends(get_db)):
    """UC01 – nhóm động vật theo ngôn ngữ (bộ lọc, form admin)."""
    return await category_service.list_categories(db, lang)


@router.get("/api/conservation-statuses", response_model=list[ConservationStatusOut])
async def list_conservation_statuses(lang: str | None = _LANG, db: AsyncSession = Depends(get_db)):
    """Mức bảo tồn IUCN theo ngôn ngữ (form admin)."""
    return await category_service.list_statuses(db, lang)
