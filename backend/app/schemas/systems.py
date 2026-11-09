"""Tầng schema – thống kê (UC09), cài đặt hệ thống và ngôn ngữ."""
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.zone import OPEN_HOURS_PATTERN

# Hotline: 8–20 ký tự gồm số, dấu cách, chấm, gạch ngang, có thể bắt đầu bằng +
HOTLINE_PATTERN = r"^\+?[0-9][0-9 .-]{6,18}[0-9]$"


# ----- THỐNG KÊ -----

class LanguageStats(BaseModel):
    lang: str
    pois_missing_narration: int  # số POI chưa có lời thuyết minh ở ngôn ngữ này
    pois_missing_audio: int  # số POI chưa có file âm thanh ở ngôn ngữ này


class DashboardOut(BaseModel):
    total_animals: int
    visible_animals: int
    hidden_animals: int
    total_zones: int
    total_pois: int
    animals_without_poi: int
    by_language: list[LanguageStats]


# ----- CÀI ĐẶT -----

class SettingsOut(BaseModel):
    zoo_name: str
    open_hours: str | None
    hotline: str | None
    default_lang: str

    model_config = ConfigDict(from_attributes=True)


class SettingsUpdate(BaseModel):
    """Chỉ field được gửi mới đổi. Sai định dạng / thiếu tên sở thú -> 422 (UC09 E3)."""
    zoo_name: str | None = Field(None, min_length=1, max_length=100)
    open_hours: str | None = Field(None, pattern=OPEN_HOURS_PATTERN, examples=["07h00-17h00"])
    hotline: str | None = Field(None, pattern=HOTLINE_PATTERN, max_length=20, examples=["1900 1234"])
    default_lang: str | None = Field(None, min_length=2, max_length=10)

    @model_validator(mode="after")
    def _check(self):
        for field in self.model_fields_set & {"zoo_name", "default_lang"}:
            if getattr(self, field) is None:
                raise ValueError(f"Trường '{field}' không được để null")
        if self.open_hours:
            open_at, close_at = self.open_hours.split("-")  # định dạng cố định nên so sánh chuỗi được
            if open_at >= close_at:
                raise ValueError("Giờ mở cửa phải trước giờ đóng cửa")
        return self


# ----- NGÔN NGỮ -----

class LanguageOut(BaseModel):
    code: str
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class LanguageUpdate(BaseModel):
    is_active: bool
