"""Tầng router – nhóm API POI và THUYẾT MINH (/api/pois, /api/translate).

Khách: xem POI trên bản đồ, nghe thuyết minh (UC02, UC03). Admin: UC08 Quản lý POI và thuyết minh.
"""
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_optional_admin, require_admin
from app.schemas.poi import (
    AudioDraftOut, AudioSaveRequest, PoiAdmin, PoiCreate, PoiListItem, PoiPublic, PoiUpdate,
    TranslateRequest, TranslateResponse,
)
from app.services import poi_service

router = APIRouter(tags=["POI & Thuyết minh"])
_LANG = Query(None, description="vi | en | zh; bỏ trống = ngôn ngữ mặc định")
_AUDIO_LANG = Query(..., min_length=2, max_length=10, description="Ngôn ngữ của file âm thanh: vi | en | zh")


# --- Khách (admin gửi token thì thấy cả POI của động vật đang ẩn) ---
@router.get("/api/pois", response_model=list[PoiListItem])
async def list_pois(lang: str | None = _LANG, zone_id: int | None = Query(None, description="Lọc theo khu của động vật"),
                    db: AsyncSession = Depends(get_db), viewer=Depends(get_optional_admin)):
    """UC02 – các điểm POI trên bản đồ kèm tên chuồng, chỉ dẫn, thuyết minh và file âm thanh đã lưu."""
    return await poi_service.list_pois(db, lang, zone_id, include_hidden=viewer is not None)


@router.get("/api/pois/{poi_id}", response_model=PoiPublic)
async def get_poi(poi_id: int, lang: str | None = _LANG, db: AsyncSession = Depends(get_db),
                  viewer=Depends(get_optional_admin)):
    """UC03 – thuyết minh của một POI theo ngôn ngữ. 404 nếu không có hoặc động vật đang ẩn."""
    return await poi_service.get_poi(db, poi_id, lang, include_hidden=viewer is not None)


# --- Admin ---
@router.get("/api/pois/{poi_id}/admin", response_model=PoiAdmin)
async def get_poi_admin(poi_id: int, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC08 – POI kèm nội dung mọi ngôn ngữ (form sửa 3 tab)."""
    return await poi_service.get_poi_admin(db, poi_id)


@router.post("/api/pois", response_model=PoiAdmin, status_code=status.HTTP_201_CREATED)
async def create_poi(data: PoiCreate, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC08 – thêm POI. 404 động vật không có, 409 động vật đã có POI, 422 tọa độ sai / thiếu ngôn ngữ mặc định."""
    return await poi_service.create_poi(db, data)


@router.patch("/api/pois/{poi_id}", response_model=PoiAdmin)
async def update_poi(poi_id: int, data: PoiUpdate, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC08 – sửa POI và nội dung. Sửa lời thuyết minh khi đã có âm thanh thì file cũ bị xóa."""
    return await poi_service.update_poi(db, poi_id, data)


@router.delete("/api/pois/{poi_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poi(poi_id: int, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC08 A4 – xóa POI, nội dung và các file âm thanh của POI."""
    await poi_service.delete_poi(db, poi_id)


@router.post("/api/translate", response_model=TranslateResponse)
async def translate(data: TranslateRequest, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC08 A1 – dịch lời thuyết minh sang các ngôn ngữ còn lại (chỉ trả kết quả, không lưu).
    422 lời trống, 503 dịch vụ dịch lỗi."""
    return await poi_service.translate(db, data.text, data.source_lang)


@router.post("/api/pois/{poi_id}/audio/preview", response_model=AudioDraftOut, status_code=status.HTTP_201_CREATED)
async def create_audio_preview(poi_id: int, lang: str = _AUDIO_LANG, db: AsyncSession = Depends(get_db),
                               admin=Depends(require_admin)):
    """UC08 bước 7 – tạo file mp3 NHÁP từ lời thuyết minh đã lưu (chưa ghi CSDL). Bấm lần nữa = Tạo lại.
    400 ngôn ngữ tắt, 422 chưa có lời thuyết minh, 503 dịch vụ giọng đọc lỗi."""
    return await poi_service.create_preview(db, poi_id, lang)


@router.get("/api/pois/{poi_id}/audio/preview/{draft_id}", response_class=FileResponse)
async def get_audio_preview(poi_id: int, draft_id: str, admin=Depends(require_admin)):
    """UC08 bước 8 – admin nghe thử file nháp (cần token; khách không mở được file nháp)."""
    return FileResponse(poi_service.draft_file(poi_id, draft_id), media_type="audio/mpeg")


@router.put("/api/pois/{poi_id}/audio", response_model=PoiAdmin)
async def save_audio(poi_id: int, data: AudioSaveRequest, lang: str = _AUDIO_LANG,
                     db: AsyncSession = Depends(get_db), admin=Depends(require_admin)):
    """UC08 bước 9 – lưu file nháp đã nghe thử thành file chính (ghi audioFile, xóa file cũ)."""
    return await poi_service.save_audio(db, poi_id, lang, data.draft_id)


@router.delete("/api/pois/{poi_id}/audio", response_model=PoiAdmin)
async def delete_audio(poi_id: int, lang: str = _AUDIO_LANG, db: AsyncSession = Depends(get_db),
                       admin=Depends(require_admin)):
    """Xóa file âm thanh đã lưu của một ngôn ngữ."""
    return await poi_service.delete_audio(db, poi_id, lang)
