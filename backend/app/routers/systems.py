"""Tầng router – nhóm API SYSTEMS và LANGUAGES: thống kê, cài đặt, bật/tắt ngôn ngữ (UC09), đổi ngôn ngữ (UC04)."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_optional_admin, require_admin
from app.schemas.systems import DashboardOut, LanguageOut, LanguageUpdate, SettingsOut, SettingsUpdate
from app.services import settings_service, stats_service

router = APIRouter(tags=["Systems"])


@router.get("/api/systems/dashboard", response_model=DashboardOut)
async def dashboard(db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC09 – thống kê tổng quan (Admin)."""
    return await stats_service.get_dashboard(db)


@router.get("/api/systems/public", response_model=SettingsOut)
async def public_settings(db: AsyncSession = Depends(get_db)):
    """Công khai – tên sở thú, giờ mở cửa, hotline, ngôn ngữ mặc định cho trang chủ khách (UC04 A1)."""
    return await settings_service.get_settings(db)


@router.get("/api/systems/settings", response_model=SettingsOut)
async def get_settings(db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC09 – xem cài đặt hệ thống."""
    return await settings_service.get_settings(db)


@router.put("/api/systems/settings", response_model=SettingsOut)
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC09 – cập nhật cài đặt (chỉ field được gửi). 400 ngôn ngữ mặc định đang tắt, 422 sai định dạng."""
    return await settings_service.update_settings(db, data)


@router.get("/api/languages", response_model=list[LanguageOut])
async def list_languages(db: AsyncSession = Depends(get_db), viewer=Depends(get_optional_admin)):
    """UC04 – ngôn ngữ đang bật (khách); admin gửi token thì thấy cả ngôn ngữ đang tắt."""
    return await settings_service.list_languages(db, include_inactive=viewer is not None)


@router.patch("/api/languages/{code}", response_model=LanguageOut)
async def update_language(code: str, data: LanguageUpdate, db: AsyncSession = Depends(get_db),
                          admin=Depends(require_admin)):
    """UC09 A1 – bật/tắt ngôn ngữ. 400 nếu tắt ngôn ngữ mặc định."""
    return await settings_service.set_language_active(db, code, data.is_active)
