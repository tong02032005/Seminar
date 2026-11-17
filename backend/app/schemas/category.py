"""Tầng schema – nhóm động vật và mức bảo tồn (chỉ đọc, nạp sẵn)."""
from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    code: str  # mammal, bird, reptile...
    name: str  # tên theo ngôn ngữ


class ConservationStatusOut(BaseModel):
    code: str  # EX, CR, LC...
    name: str
    color: str | None = None
