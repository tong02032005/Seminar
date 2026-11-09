"""Tầng service – UC09 Quản trị hệ thống: cài đặt (tên sở thú, giờ mở cửa, hotline, ngôn ngữ mặc định)
và bật/tắt ngôn ngữ. Quy tắc: ngôn ngữ mặc định luôn phải đang bật."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.language import Language
from app.models.settings import SystemSettings
from app.repositories import lookup_repository, settings_repository
from app.schemas.systems import SettingsUpdate


async def get_settings(db: AsyncSession) -> SystemSettings:
    return await settings_repository.get(db)


async def update_settings(db: AsyncSession, data: SettingsUpdate) -> SystemSettings:
    """UC09 bước 5–6 – chỉ field được gửi mới đổi. Chọn ngôn ngữ không có / đang tắt làm mặc định -> 400 (UC09 E1)."""
    fields = data.model_dump(exclude_unset=True)
    if "default_lang" in fields:
        language = await lookup_repository.get_language(db, fields["default_lang"])
        if language is None or not language.is_active:
            raise BusinessRuleError(f"Ngôn ngữ '{fields['default_lang']}' không tồn tại hoặc đang tắt")
    settings = await settings_repository.get(db)
    for field, value in fields.items():
        setattr(settings, field, value)
    await db.commit()
    return settings


async def list_languages(db: AsyncSession, include_inactive: bool = False) -> list[Language]:
    """UC04 bước 2 – khách chỉ thấy ngôn ngữ đang bật; admin thấy tất cả."""
    return await lookup_repository.list_languages(db, only_active=not include_inactive)


async def set_language_active(db: AsyncSession, code: str, is_active: bool) -> Language:
    """UC09 A1 – bật/tắt ngôn ngữ. Không có -> 404; tắt ngôn ngữ mặc định -> 400 (UC09 E1)."""
    language = await lookup_repository.get_language(db, code)
    if language is None:
        raise NotFoundError("Ngôn ngữ không tồn tại")
    if not is_active and (await settings_repository.get(db)).default_lang == code:
        raise BusinessRuleError("Không thể tắt ngôn ngữ mặc định, hãy đổi ngôn ngữ mặc định trước")
    language.is_active = is_active
    await db.commit()
    return language
