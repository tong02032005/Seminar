"""Tầng service – UC02/UC03 (khách xem POI, nghe thuyết minh) và UC08 Quản lý POI và thuyết minh (admin).

Quy tắc chính:
- POI 1–1 với động vật; POI của động vật đang ẩn không hiện với khách.
- File âm thanh chỉ do hệ thống tạo: Tạo âm thanh -> file NHÁP (ngoài thư mục static, chỉ admin nghe được)
  -> admin bấm Lưu -> chuyển thành file chính, ghi audioFile. Khách chỉ nhận audioFile đã lưu.
- Sửa lời thuyết minh khi đã có âm thanh: xóa file cũ, audioFile = NULL.
"""
import logging
import re
import shutil
import time
import uuid
from pathlib import Path

from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.exceptions import BusinessRuleError, ConflictError, InvalidDataError, NotFoundError, ServiceUnavailableError
from app.models.animal import Animal
from app.models.poi import Poi, PoiContent
from app.repositories import animal_repository, lookup_repository, poi_repository
from app.schemas.poi import PoiContentIn, PoiCreate, PoiUpdate
from app.services import narration_service
from app.services.i18n import default_lang, resolve_lang

_UNAVAILABLE = "Dịch vụ tạm thời không dùng được, hãy thử lại sau"
logger = logging.getLogger("uvicorn.error")


def _unavailable(exc: Exception) -> ServiceUnavailableError:
    """Ghi lỗi gốc ra terminal backend và kèm lý do ngắn trong thông báo để dễ tìm nguyên nhân."""
    logger.exception("Dịch vụ ngoài lỗi")
    return ServiceUnavailableError(f"{_UNAVAILABLE} ({type(exc).__name__}: {str(exc)[:200]})")
_DRAFT_RE = re.compile(r"^(\d+)_([a-z]{2,10})_[0-9a-f]{32}$")  # <poiId>_<lang>_<uuid>


# ---------- đọc (khách + admin) ----------

def _pick(contents: dict[str, PoiContent], lang: str, default: str) -> PoiContent | None:
    """Nội dung ngôn ngữ đang chọn -> ngôn ngữ mặc định -> bản bất kỳ."""
    return contents.get(lang) or contents.get(default) or next(iter(contents.values()), None)


def _public(poi: Poi, animal: Animal, contents: dict[str, PoiContent], animal_name: str | None,
            lang: str, default: str) -> dict:
    content = _pick(contents, lang, default)
    return {
        "id": poi.id, "animal_id": animal.id, "animal_name": animal_name or animal.scientific_name,
        "animal_image": animal.image, "zone_id": animal.zone_id, "icon": poi.icon,
        "latitude": float(poi.latitude), "longitude": float(poi.longitude),
        "lang": content.lang if content else lang,
        "name": content.name if content else (animal_name or animal.scientific_name),
        "direction": content.direction if content else None,
        "narration": content.narration if content else None,
        # chỉ file ĐÃ LƯU (audioFile); file nháp không bao giờ có ở đây (UC03, UC08)
        "audio_url": content.audio_file if content else None,
        "animal_available": animal.available,
        "narration_langs": sorted(c.lang for c in contents.values() if c.narration),
        "audio_langs": sorted(c.lang for c in contents.values() if c.audio_file),
    }


async def _build(db: AsyncSession, rows: list[tuple[Poi, Animal]], lang: str | None) -> list[dict]:
    lang = await resolve_lang(db, lang)
    default = await default_lang(db)
    contents = await poi_repository.contents_by_poi(db, [poi.id for poi, _ in rows])
    names = await poi_repository.animal_names(db, [a.id for _, a in rows], lang, default)
    return [_public(poi, animal, contents[poi.id], names.get(animal.id), lang, default) for poi, animal in rows]


async def list_pois(db: AsyncSession, lang: str | None = None, zone_id: int | None = None,
                    include_hidden: bool = False) -> list[dict]:
    """UC02 bước 6 / A1 – các điểm POI trên bản đồ (lọc theo khu của động vật). Khách không thấy POI
    của động vật đang ẩn; admin (include_hidden) thấy tất cả."""
    rows = await poi_repository.list_with_animal(db, include_hidden, zone_id)
    return await _build(db, rows, lang)


async def get_poi(db: AsyncSession, poi_id: int, lang: str | None = None, include_hidden: bool = False) -> dict:
    """UC03 bước 2 – POI theo ngôn ngữ kèm lời thuyết minh và file âm thanh (nếu đã lưu). 404 nếu không có
    hoặc động vật đang ẩn (với khách)."""
    rows = await poi_repository.list_with_animal(db, include_hidden, poi_id=poi_id)
    if not rows:
        raise NotFoundError("Không tìm thấy điểm tham quan")
    return (await _build(db, rows, lang))[0]


async def public_for_animal(db: AsyncSession, animal: Animal, lang: str | None) -> dict | None:
    """POI của một động vật cho trang chi tiết (UC01 bước 6). Chưa có POI -> None ("Chưa có thuyết minh")."""
    poi = await poi_repository.get_by_animal(db, animal.id)
    if poi is None:
        return None
    return (await _build(db, [(poi, animal)], lang))[0]


async def _get_or_404(db: AsyncSession, poi_id: int) -> Poi:
    poi = await poi_repository.get(db, poi_id)
    if poi is None:
        raise NotFoundError("Không tìm thấy điểm tham quan")
    return poi


async def get_poi_admin(db: AsyncSession, poi_id: int) -> dict:
    """POI + nội dung mọi ngôn ngữ (form sửa 3 tab của admin)."""
    poi = await _get_or_404(db, poi_id)
    contents = await poi_repository.contents_by_poi(db, [poi.id])
    return {"id": poi.id, "animal_id": poi.animal_id, "icon": poi.icon, "latitude": float(poi.latitude),
            "longitude": float(poi.longitude), "contents": list(contents[poi.id].values())}


# ---------- thêm / sửa / xóa POI ----------

async def _validate_langs(db: AsyncSession, contents: list[PoiContentIn]) -> None:
    for content in contents:
        if await lookup_repository.get_language(db, content.lang) is None:
            raise BusinessRuleError(f"Ngôn ngữ '{content.lang}' không được hỗ trợ")


def _audio_path(url: str | None) -> Path | None:
    """'/static/audio/x.mp3' -> đường dẫn file trên đĩa (chỉ lấy tên file để không thoát khỏi AUDIO_DIR)."""
    return config.AUDIO_DIR / Path(url).name if url else None


def _remove_files(urls: list[str | None]) -> None:
    for url in urls:
        path = _audio_path(url)
        if path is not None:
            path.unlink(missing_ok=True)


async def create_poi(db: AsyncSession, data: PoiCreate) -> dict:
    """UC08 – thêm POI. 404 động vật không tồn tại; 409 động vật đã có POI; 422 thiếu nội dung ở ngôn ngữ mặc định."""
    if await animal_repository.get_by_id(db, data.animal_id) is None:
        raise NotFoundError("Động vật không tồn tại")
    if await poi_repository.get_by_animal(db, data.animal_id) is not None:
        raise ConflictError("Động vật này đã có vị trí trên bản đồ (mỗi động vật chỉ có một POI)")
    await _validate_langs(db, data.contents)
    default = await default_lang(db)
    if not any(c.lang == default for c in data.contents):
        raise InvalidDataError(f"Thiếu nội dung ở ngôn ngữ mặc định ({default})")
    poi = await poi_repository.add(
        db, Poi(animal_id=data.animal_id, icon=data.icon, latitude=data.latitude, longitude=data.longitude),
        [PoiContent(**c.model_dump()) for c in data.contents])
    await db.commit()
    return await get_poi_admin(db, poi.id)


async def update_poi(db: AsyncSession, poi_id: int, data: PoiUpdate) -> dict:
    """UC08 – sửa POI. Nội dung gửi lên thay bản cùng ngôn ngữ. Lời thuyết minh đổi mà đang có âm thanh
    -> xóa file cũ, audioFile = NULL (UC08 A3; form đã hỏi admin xác nhận trước khi gửi)."""
    poi = await _get_or_404(db, poi_id)
    contents = data.contents or []
    await _validate_langs(db, contents)
    for field, value in data.model_dump(exclude_unset=True, exclude={"contents"}).items():
        setattr(poi, field, value)
    removed: list[str] = []
    for item in contents:
        content = await poi_repository.get_content(db, poi_id, item.lang)
        if content is None:
            db.add(PoiContent(poi_id=poi_id, **item.model_dump()))
            continue
        if content.audio_file and (content.narration or "") != (item.narration or ""):
            removed.append(content.audio_file)
            content.audio_file = None
        for field, value in item.model_dump(exclude={"lang"}).items():
            setattr(content, field, value)
    await db.commit()
    await run_in_threadpool(_remove_files, removed)  # xóa file SAU khi CSDL đã lưu thành công
    return await get_poi_admin(db, poi_id)


async def delete_poi(db: AsyncSession, poi_id: int) -> None:
    """UC08 A4 – xóa POI, POI_CONTENT (CASCADE) và mọi file âm thanh của POI."""
    poi = await _get_or_404(db, poi_id)
    files = [c.audio_file for c in (await poi_repository.contents_by_poi(db, [poi_id]))[poi_id].values()]
    await poi_repository.delete(db, poi)
    await db.commit()
    await run_in_threadpool(_remove_files, files)


# ---------- tự dịch ----------

async def translate(db: AsyncSession, text: str, source_lang: str) -> dict:
    """UC08 A1 – dịch lời thuyết minh sang các ngôn ngữ còn lại; chỉ trả kết quả, KHÔNG lưu.
    422 lời trống; 400 ngôn ngữ nguồn không hỗ trợ; 503 dịch vụ dịch lỗi."""
    if not text.strip():
        raise InvalidDataError("Lời thuyết minh đang trống")
    if await lookup_repository.get_language(db, source_lang) is None:
        raise BusinessRuleError(f"Ngôn ngữ '{source_lang}' không được hỗ trợ")
    targets = [lang.code for lang in await lookup_repository.list_languages(db) if lang.code != source_lang]
    result = {}
    try:
        for target in targets:
            result[target] = await narration_service.translate(text, source_lang, target)
    except Exception as exc:  # dịch vụ ngoài lỗi kiểu gì cũng báo 503, dữ liệu không đổi
        raise _unavailable(exc) from exc
    return {"translations": result}


# ---------- âm thanh: tạo nháp, nghe thử, lưu, xóa ----------

def _cleanup_drafts() -> None:
    """Dọn file nháp không được lưu sau DRAFT_MAX_AGE_SECONDS."""
    if config.DRAFT_DIR.exists():
        limit = time.time() - config.DRAFT_MAX_AGE_SECONDS
        for path in config.DRAFT_DIR.glob("*.mp3"):
            if path.stat().st_mtime < limit:
                path.unlink(missing_ok=True)


async def create_preview(db: AsyncSession, poi_id: int, lang: str) -> dict:
    """UC08 bước 7 – đọc lời thuyết minh ĐÃ LƯU của ngôn ngữ lang thành file mp3 nháp (chưa ghi CSDL).
    404 POI; 400 ngôn ngữ đang tắt / không hỗ trợ; 422 chưa có lời thuyết minh; 503 dịch vụ giọng đọc lỗi."""
    await _get_or_404(db, poi_id)
    language = await lookup_repository.get_language(db, lang)
    if language is None or not language.is_active:
        raise BusinessRuleError(f"Ngôn ngữ '{lang}' không được hỗ trợ hoặc đang tắt")
    content = await poi_repository.get_content(db, poi_id, lang)
    if content is None or not (content.narration or "").strip():
        raise InvalidDataError("Chưa có lời thuyết minh cho ngôn ngữ này, hãy nhập và lưu trước")
    await run_in_threadpool(_cleanup_drafts)
    draft_id = f"{poi_id}_{lang}_{uuid.uuid4().hex}"
    path = config.DRAFT_DIR / f"{draft_id}.mp3"
    try:
        await narration_service.synthesize(content.narration, lang, path)
        if not path.exists() or path.stat().st_size == 0:
            raise RuntimeError("Dịch vụ giọng đọc trả về file rỗng")
    except Exception as exc:
        path.unlink(missing_ok=True)
        raise _unavailable(exc) from exc
    return {"draft_id": draft_id, "lang": lang}


def _draft_path(poi_id: int, draft_id: str, lang: str | None = None) -> Path:
    """Đường dẫn file nháp; mã sai định dạng / không thuộc POI (hoặc ngôn ngữ) này / đã bị dọn -> 404."""
    match = _DRAFT_RE.match(draft_id)
    if not match or int(match.group(1)) != poi_id or (lang is not None and match.group(2) != lang):
        raise NotFoundError("Không tìm thấy file nháp")
    path = config.DRAFT_DIR / f"{draft_id}.mp3"
    if not path.exists():
        raise NotFoundError("File nháp không còn, hãy bấm Tạo lại")
    return path


def draft_file(poi_id: int, draft_id: str) -> Path:
    """File nháp để admin nghe thử (API có token)."""
    return _draft_path(poi_id, draft_id)


async def save_audio(db: AsyncSession, poi_id: int, lang: str, draft_id: str) -> dict:
    """UC08 bước 9 – chuyển file nháp thành file chính, ghi audioFile, xóa file cũ (nếu có). Khách nghe được ngay."""
    await _get_or_404(db, poi_id)
    content = await poi_repository.get_content(db, poi_id, lang)
    if content is None:
        raise InvalidDataError("Chưa có nội dung cho ngôn ngữ này")
    draft = _draft_path(poi_id, draft_id, lang)
    config.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    await run_in_threadpool(shutil.move, draft, config.AUDIO_DIR / draft.name)
    old = content.audio_file
    content.audio_file = f"/static/audio/{draft.name}"
    await db.commit()
    await run_in_threadpool(_remove_files, [old])
    return await get_poi_admin(db, poi_id)


async def delete_audio(db: AsyncSession, poi_id: int, lang: str) -> dict:
    """Xóa file âm thanh đã lưu của một ngôn ngữ (audioFile = NULL)."""
    await _get_or_404(db, poi_id)
    content = await poi_repository.get_content(db, poi_id, lang)
    if content is None or content.audio_file is None:
        raise NotFoundError("Ngôn ngữ này chưa có file âm thanh")
    old, content.audio_file = content.audio_file, None
    await db.commit()
    await run_in_threadpool(_remove_files, [old])
    return await get_poi_admin(db, poi_id)
