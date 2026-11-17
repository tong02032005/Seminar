"""Tầng service – nghiệp vụ động vật: UC01 Tra cứu động vật (danh sách, chi tiết, liên quan), UC06 Quản lý động vật.

Áp quy tắc nghiệp vụ (ẩn/hiện, trùng tên, tồn tại khóa ngoại), gọi repository, commit giao dịch.
Mọi hàm là async vì đều chờ SQLite; các truy vấn chạy TUẦN TỰ (await từng câu) trên cùng một
AsyncSession, không dùng asyncio.gather (một session không chạy song song nhiều câu được).
"""
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, ConflictError, InvalidDataError, NotFoundError
from app.models.animal import Animal, AnimalTranslation
from app.repositories import animal_repository, lookup_repository, poi_repository
from app.schemas.animals import AnimalBase, AnimalCreate, AnimalTranslationBase, AnimalTranslationCreate, AnimalUpdate
from app.services import image_service, poi_service
from app.services.i18n import default_lang, resolve_lang

# Các cột của bảng ANIMAL và ANIMAL_TRANSLATION, lấy từ schema để không phải gõ lại
_ANIMAL_FIELDS = tuple(AnimalBase.model_fields)
_TRANSLATION_FIELDS = tuple(AnimalTranslationBase.model_fields)


async def _items(db: AsyncSession, rows, lang: str, default: str) -> list[dict]:
    """Ghép (animal, bản dịch) thành các dòng AnimalListItem kèm tên khu, tên nhóm, đã có POI chưa."""
    zones = await lookup_repository.zone_names(db, lang, default)
    categories = await lookup_repository.category_names(db, lang, default)
    with_poi = await poi_repository.animal_ids_with_poi(db)
    return [_to_item(a, tr) | {"zone_name": zones.get(a.zone_id), "category_name": categories.get(a.category_id),
                               "has_poi": a.id in with_poi} for a, tr in rows]


def _to_item(animal: Animal, tr: AnimalTranslation | None) -> dict:
    """Ghép animal + bản dịch thành 1 dòng AnimalListItem; chưa có bản dịch nào thì tên = tên khoa học."""
    return {
        "id": animal.id,
        "name": tr.name if tr else animal.scientific_name,
        "scientific_name": animal.scientific_name,
        "image": animal.image,
        "zone_id": animal.zone_id,
        "category_id": animal.category_id,
        "conservation_status_code": animal.conservation_status_code,
        "available": animal.available,
        "popularity": animal.popularity,
    }


async def _get_or_404(db: AsyncSession, animal_id: int, include_hidden: bool = True) -> Animal:
    """Lấy động vật theo id.

    include_hidden=False: động vật đang ẩn coi như không tồn tại (khách không được biết nó còn trong CSDL).
    Lỗi: NotFoundError (404) nếu không có, hoặc đang ẩn mà include_hidden=False.
    """
    animal = await animal_repository.get_by_id(db, animal_id)  # await: chờ SQLite trả động vật
    # Kiểm tra available: động vật đang ẩn trả 404 giống như đã xóa (UC01 E3)
    if animal is None or (not include_hidden and not animal.available):
        raise NotFoundError("Không tìm thấy động vật")
    return animal


async def search_animals(db: AsyncSession, q: str | None = None, category_id: int | None = None,
                         zone_id: int | None = None, sort: str = "name", lang: str | None = None,
                         page: int = 1, size: int = 20, include_hidden: bool = False) -> dict:
    """UC01 – Xem/tìm/lọc động vật.

    Tham số: q – từ khóa tên; category_id, zone_id – bộ lọc; sort – name|popular|newest;
    lang – ngôn ngữ hiển thị; page/size – phân trang; include_hidden – True khi người gọi là admin (UC06).
    Trả về: {items, total, page, size} (schema AnimalPage). Không ném lỗi (không có kết quả -> items rỗng).
    """
    lang, default = await resolve_lang(db, lang), await default_lang(db)
    rows, total = await animal_repository.list_animals(
        db, lang, default, search=q, category_id=category_id,
        zone_id=zone_id, sort=sort, include_hidden=include_hidden,
        offset=(page - 1) * size, limit=size)  # phân trang: bỏ qua (page-1)*size dòng đầu
    return {"items": await _items(db, rows, lang, default), "total": total, "page": page, "size": size}


async def get_animal(db: AsyncSession, animal_id: int, lang: str | None = None, include_hidden: bool = False) -> dict:
    """UC02 – Xem chi tiết động vật.

    Tham số: lang – ngôn ngữ hiển thị; include_hidden – True khi người gọi là admin.
    Trả về: dict theo schema AnimalWithTranslationResponse. Thứ tự chọn bản dịch:
    ngôn ngữ yêu cầu -> ngôn ngữ mặc định -> bản dịch bất kỳ.
    Lỗi: NotFoundError (404) nếu không có hoặc đang ẩn với khách.
    """
    animal = await _get_or_404(db, animal_id, include_hidden)
    lang, default = await resolve_lang(db, lang), await default_lang(db)
    tr = await animal_repository.get_translation(db, animal_id, lang)
    tr_def = await animal_repository.get_translation(db, animal_id, default)
    tr = tr or tr_def or next(iter(await animal_repository.list_translations(db, animal_id)), None)
    data = {field: getattr(animal, field) for field in _ANIMAL_FIELDS}
    # Từng mục mô tả còn trống ở ngôn ngữ đang chọn thì lấy bản ngôn ngữ mặc định (không để trống)
    data.update({field: (getattr(tr, field) if tr else None) or (getattr(tr_def, field) if tr_def else None)
                 for field in _TRANSLATION_FIELDS})
    data.update(id=animal.id, name=tr.name if tr else animal.scientific_name, lang=tr.lang if tr else lang)
    statuses = dict((s.code, (name, s.color)) for s, name in await lookup_repository.list_statuses(db, lang, default))
    status_name, status_color = statuses.get(animal.conservation_status_code, (None, None))
    data.update(
        zone_name=(await lookup_repository.zone_names(db, lang, default)).get(animal.zone_id),
        category_name=(await lookup_repository.category_names(db, lang, default)).get(animal.category_id),
        conservation_status_name=status_name, conservation_status_color=status_color,
        poi=await poi_service.public_for_animal(db, animal, lang),
    )
    return data


async def get_related(db: AsyncSession, animal_id: int, lang: str | None = None, limit: int = 4) -> list[dict]:
    """UC01 bước 6 – tối đa `limit` động vật liên quan: cùng nhóm hoặc cùng khu vực, chỉ động vật đang hiển thị.

    Trả về: danh sách AnimalListItem (cùng nhóm xếp trước). Lỗi: 404 nếu động vật gốc không có hoặc đang ẩn.
    """
    animal = await _get_or_404(db, animal_id, include_hidden=False)
    lang, default = await resolve_lang(db, lang), await default_lang(db)
    rows = await animal_repository.list_related(db, animal, lang, default, limit)
    return await _items(db, rows, lang, default)


async def get_animal_admin(db: AsyncSession, animal_id: int) -> dict:
    """UC06 – động vật + mọi bản dịch (form sửa 3 tab), kể cả động vật đang ẩn."""
    return await _admin_view(db, await _get_or_404(db, animal_id))


async def _admin_view(db: AsyncSession, animal: Animal) -> dict:
    """Dữ liệu trả admin sau khi tạo/sửa: thông tin chung + mọi bản dịch (schema AnimalAdminResponse)."""
    data = {field: getattr(animal, field) for field in _ANIMAL_FIELDS}
    data.update(id=animal.id, translations=await animal_repository.list_translations(db, animal.id))
    return data


async def _validate(db: AsyncSession, fields: dict, translations: list[AnimalTranslationCreate],
                    exclude_id: int | None = None, require_default: bool = False) -> None:
    """Kiểm tra cần tra CSDL khi thêm/sửa (UC06 E1, E2). Chỉ kiểm tra field có trong `fields`.

    Lỗi: NotFoundError (404) – khu vực / nhóm / mức bảo tồn không tồn tại;
    BusinessRuleError (400) – ngôn ngữ bản dịch không được hỗ trợ;
    ConflictError (409) – trùng tên khoa học, hoặc trùng tên trong cùng ngôn ngữ;
    InvalidDataError (422) – thêm mới mà thiếu tên ở ngôn ngữ mặc định.
    """
    if "zone_id" in fields and not await lookup_repository.zone_exists(db, fields["zone_id"]):
        raise NotFoundError("Khu vực không tồn tại")
    if "category_id" in fields and not await lookup_repository.category_exists(db, fields["category_id"]):
        raise NotFoundError("Nhóm động vật không tồn tại")
    if ("conservation_status_code" in fields
            and not await lookup_repository.status_exists(db, fields["conservation_status_code"])):
        raise NotFoundError("Mức bảo tồn không tồn tại")
    # Kiểm tra trùng ở service để trả 409 dễ hiểu, thay vì để CSDL ném lỗi UNIQUE (500)
    if "scientific_name" in fields and await animal_repository.exists_scientific_name(
            db, fields["scientific_name"], exclude_id):
        raise ConflictError("Tên khoa học đã tồn tại")
    for tr in translations:
        if await lookup_repository.get_language(db, tr.lang) is None:
            raise BusinessRuleError(f"Ngôn ngữ '{tr.lang}' không được hỗ trợ")
        if await animal_repository.exists_name(db, tr.lang, tr.name, exclude_id):
            raise ConflictError(f"Tên '{tr.name}' đã tồn tại")
    default = await default_lang(db)
    if require_default and not any(tr.lang == default for tr in translations):
        raise InvalidDataError(f"Thiếu tên động vật ở ngôn ngữ mặc định ({default})")


def _translations(items: list[AnimalTranslationCreate]) -> list[AnimalTranslation]:
    """Đổi danh sách bản dịch trong request thành các object model (không có I/O nên là hàm thường)."""
    return [AnimalTranslation(**tr.model_dump()) for tr in items]


async def create_animal(db: AsyncSession, data: AnimalCreate) -> dict:
    """UC06 – Thêm động vật kèm bản dịch trong MỘT giao dịch.

    Trả về: AnimalAdminResponse (kèm mọi bản dịch). Lỗi: 404/400/409 như _validate; 422 do Pydantic.
    """
    fields = data.model_dump(include=set(_ANIMAL_FIELDS))
    await _validate(db, fields, data.translations, require_default=True)
    animal = await animal_repository.add(db, Animal(**fields), _translations(data.translations))
    # Commit ở service (không ở repository) để thêm động vật + bản dịch là 1 giao dịch:
    # lỗi ở bất kỳ bước nào thì không có gì được lưu
    await db.commit()  # await: chờ SQLite ghi hẳn
    return await _admin_view(db, animal)


async def update_animal(db: AsyncSession, animal_id: int, data: AnimalUpdate) -> dict:
    """UC06 – Sửa một phần động vật (PATCH), gồm cả ẩn/hiện bằng available (xóa mềm, UC06 A2).

    Chỉ field client thật sự gửi mới được đổi (exclude_unset). Bản dịch gửi lên thay thế bản cùng ngôn ngữ.
    Trả về: AnimalAdminResponse. Lỗi: 404 nếu không có động vật; 404/400/409 như _validate.
    """
    animal = await _get_or_404(db, animal_id)  # admin sửa được cả động vật đang ẩn
    # exclude_unset: chỉ lấy field có trong JSON gửi lên, để field không gửi giữ nguyên giá trị cũ
    fields = data.model_dump(exclude_unset=True, exclude={"translations"})
    translations = data.translations or []
    await _validate(db, fields, translations, exclude_id=animal_id)
    for field, value in fields.items():
        setattr(animal, field, value)
    if translations:
        await animal_repository.upsert_translations(db, animal_id, _translations(translations))
    await db.commit()  # commit 1 lần cho cả thông tin chung và bản dịch
    return await _admin_view(db, animal)


async def upload_image(db: AsyncSession, animal_id: int, upload: UploadFile) -> dict:
    """UC06 – Tải ảnh động vật (multipart/form-data); lưu file rồi ghi đường dẫn vào cột image.

    Trả về: AnimalAdminResponse. Lỗi: 404 không có động vật; 400 không phải ảnh hợp lệ / vượt dung lượng.
    """
    animal = await _get_or_404(db, animal_id)  # kiểm tra động vật trước để không lưu file "mồ côi"
    animal.image = await image_service.save_image(upload, "animals")  # await: chờ đọc + lưu file
    await db.commit()
    return await _admin_view(db, animal)


async def delete_animal(db: AsyncSession, animal_id: int) -> None:
    """UC06 A2 – Xóa vĩnh viễn động vật; bản dịch tự xóa theo ON DELETE CASCADE.

    Lỗi: 404 nếu không có; 409 nếu động vật còn POI (poi.animalId RESTRICT, UC06 E3) – service kiểm tra trước
    để trả thông báo dễ hiểu, CSDL là lớp chặn thứ hai.
    """
    animal = await _get_or_404(db, animal_id)
    if await poi_repository.get_by_animal(db, animal_id) is not None:
        raise ConflictError("Động vật đang có vị trí trên bản đồ, hãy xóa POI trước")
    await animal_repository.delete(db, animal)
    await db.commit()
