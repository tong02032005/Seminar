"""Tầng schema – POI (vị trí chuồng của động vật), nội dung theo ngôn ngữ, thuyết minh và âm thanh."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ----- INPUT -----

class PoiContentIn(BaseModel):
    """Nội dung 1 ngôn ngữ của POI. narration_source: manual = admin tự viết, auto = do nút Dịch điền vào."""
    lang: str = Field(min_length=2, max_length=10)
    name: str = Field(min_length=1, max_length=100)
    direction: str | None = None
    narration: str | None = None
    narration_source: Literal["manual", "auto"] = "manual"


def _unique_lang(value):
    """Mỗi ngôn ngữ chỉ 1 nội dung trong cùng request (trùng -> 422)."""
    if value:
        langs = [c.lang for c in value]
        if len(langs) != len(set(langs)):
            raise ValueError("Mỗi ngôn ngữ chỉ được có 1 nội dung")
    return value


class PoiCreate(BaseModel):
    """POST /api/pois – thêm POI cho động vật chưa có POI. Tọa độ sai phạm vi -> 422."""
    animal_id: int
    icon: str | None = Field(None, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    contents: list[PoiContentIn] = Field(min_length=1)

    _unique = field_validator("contents")(_unique_lang)


class PoiUpdate(BaseModel):
    """PATCH /api/pois/{id} – sửa một phần. Nội dung gửi lên thay bản cùng ngôn ngữ; sửa lời thuyết minh
    khi đã có âm thanh thì file cũ bị xóa (audioFile = NULL)."""
    icon: str | None = Field(None, max_length=100)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    contents: list[PoiContentIn] | None = None

    _unique = field_validator("contents")(_unique_lang)

    @model_validator(mode="after")
    def _no_null_required(self):
        for field in self.model_fields_set & {"latitude", "longitude", "contents"}:
            if getattr(self, field) is None:
                raise ValueError(f"Trường '{field}' không được để null")
        return self


class TranslateRequest(BaseModel):
    """POST /api/translate – dịch lời thuyết minh từ source_lang sang các ngôn ngữ còn lại (không lưu)."""
    text: str = Field(max_length=5000)
    source_lang: str = Field(min_length=2, max_length=10)


class AudioSaveRequest(BaseModel):
    """PUT /api/pois/{id}/audio?lang= – lưu file nháp đã nghe thử thành file chính."""
    draft_id: str = Field(min_length=1, max_length=100)


# ----- OUTPUT -----

class PoiPublic(BaseModel):
    """POI cho khách theo 1 ngôn ngữ (thiếu nội dung ngôn ngữ đó thì dùng ngôn ngữ mặc định).
    audio_url chỉ có khi admin đã nghe thử và lưu; file nháp không bao giờ xuất hiện ở đây."""
    id: int
    animal_id: int
    animal_name: str
    animal_image: str | None = None
    zone_id: int
    icon: str | None = None
    latitude: float
    longitude: float
    lang: str  # ngôn ngữ thực tế của nội dung trả về
    name: str
    direction: str | None = None
    narration: str | None = None
    audio_url: str | None = None


class PoiListItem(PoiPublic):
    """Dòng danh sách POI; admin (có token) thấy thêm ngôn ngữ nào đã có thuyết minh / âm thanh."""
    animal_available: bool = True
    narration_langs: list[str] = []
    audio_langs: list[str] = []


class PoiContentOut(BaseModel):
    lang: str
    name: str
    direction: str | None = None
    narration: str | None = None
    narration_source: str
    audio_file: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PoiAdmin(BaseModel):
    """POI cho admin: thông tin chung + nội dung MỌI ngôn ngữ (để sửa trong form 3 tab)."""
    id: int
    animal_id: int
    icon: str | None = None
    latitude: float
    longitude: float
    contents: list[PoiContentOut]


class TranslateResponse(BaseModel):
    translations: dict[str, str]  # {"en": "...", "zh": "..."}


class AudioDraftOut(BaseModel):
    draft_id: str  # mã file nháp, gửi lại khi bấm Lưu âm thanh
    lang: str
