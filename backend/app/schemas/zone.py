"""Tầng schema – khu vực (ZONE) và nội dung theo ngôn ngữ (ZONE_CONTENT)."""
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}$"  # #RRGGBB
# Giờ mở cửa dạng "07h00-17h00" (giờ 00–23, phút 00–59) – khớp CHECK ck_zone_open_hours
OPEN_HOURS_PATTERN = r"^([01]\d|2[0-3])h[0-5]\d-([01]\d|2[0-3])h[0-5]\d$"


# ----- INPUT -----

class ZoneContentIn(BaseModel):
    lang: str = Field(min_length=2, max_length=10)
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


def _unique_lang(value):
    if value:
        langs = [c.lang for c in value]
        if len(langs) != len(set(langs)):
            raise ValueError("Mỗi ngôn ngữ chỉ được có 1 nội dung")
    return value


class ZoneCreate(BaseModel):
    """POST /api/zones. Sai định dạng màu / giờ / diện tích -> 422 (UC07 E1)."""
    color: str | None = Field(None, pattern=COLOR_PATTERN, examples=["#4CAF50"])
    open_hours: str | None = Field(None, pattern=OPEN_HOURS_PATTERN, examples=["07h00-17h00"])
    area_m2: float | None = Field(None, gt=0)
    image: str | None = Field(None, max_length=255)
    contents: list[ZoneContentIn] = Field(min_length=1)

    _unique = field_validator("contents")(_unique_lang)


class ZoneUpdate(BaseModel):
    """PATCH /api/zones/{id} – sửa một phần; nội dung gửi lên thay bản cùng ngôn ngữ."""
    color: str | None = Field(None, pattern=COLOR_PATTERN)
    open_hours: str | None = Field(None, pattern=OPEN_HOURS_PATTERN)
    area_m2: float | None = Field(None, gt=0)
    image: str | None = Field(None, max_length=255)
    contents: list[ZoneContentIn] | None = None

    _unique = field_validator("contents")(_unique_lang)

    @model_validator(mode="after")
    def _no_null_contents(self):
        if "contents" in self.model_fields_set and self.contents is None:
            raise ValueError("Trường 'contents' không được để null")
        return self


# ----- OUTPUT -----

class ZoneOut(BaseModel):
    """Một khu vực theo ngôn ngữ đã chọn."""
    id: int
    name: str
    description: str | None = None
    color: str | None = None
    open_hours: str | None = None
    area_m2: float | None = None
    image: str | None = None
    animal_count: int = 0  # khách: số động vật đang hiện; admin: tất cả


class ZoneContentOut(BaseModel):
    lang: str
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ZoneAdmin(BaseModel):
    """Khu vực cho admin: thông tin chung + nội dung mọi ngôn ngữ."""
    id: int
    color: str | None = None
    open_hours: str | None = None
    area_m2: float | None = None
    image: str | None = None
    contents: list[ZoneContentOut]
