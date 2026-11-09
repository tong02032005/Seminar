"""Cấu hình chung cho pytest: mỗi test chạy trên CSDL SQLite RIÊNG (file tạm), tạo bằng chính migration Alembic,
rồi nạp dữ liệu mẫu (app/core/sample_data.py). Dịch vụ dịch và giọng đọc được thay bằng hàm giả nên không cần Internet.

Chạy: python -m pytest -v
"""
import os
import tempfile
from pathlib import Path

# Đặt biến môi trường TRƯỚC khi import app: app/core/config.py đọc lúc được import
_TMP_DIR = Path(tempfile.mkdtemp(prefix="zooguide_test_"))
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{(_TMP_DIR / 'test.db').as_posix()}"
os.environ["ADMIN_EMAIL"] = "admin@zooguide.vn"
os.environ["ADMIN_PASSWORD"] = "admin12345"

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core import config  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.sample_data import load_sample_data  # noqa: E402
from app.main import app  # noqa: E402
from app.services import narration_service  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ADMIN_EMAIL, ADMIN_PASSWORD = "admin@zooguide.vn", "admin12345"


async def fake_translate(text: str, source: str, target: str) -> str:
    return f"[{target}] {text}"


async def fake_synthesize(text: str, lang: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"ID3fake-mp3 " + text.encode())


@pytest.fixture
def client(tmp_path, monkeypatch):
    """TestClient trên CSDL sạch: chạy lại migration, seed + dữ liệu mẫu. File ảnh/âm thanh ghi vào thư mục tạm."""
    alembic_cfg = Config(str(ROOT / "alembic.ini"))
    command.downgrade(alembic_cfg, "base")
    command.upgrade(alembic_cfg, "head")
    monkeypatch.setattr(config, "UPLOAD_DIR", tmp_path / "uploads")
    monkeypatch.setattr(config, "AUDIO_DIR", tmp_path / "audio")
    monkeypatch.setattr(config, "DRAFT_DIR", tmp_path / "drafts")
    monkeypatch.setattr(narration_service, "translate", fake_translate)
    monkeypatch.setattr(narration_service, "synthesize", fake_synthesize)

    async def _load():
        async with SessionLocal() as db:
            await load_sample_data(db)

    with TestClient(app) as c:  # "with" để chạy lifespan -> seed dữ liệu mặc định + tài khoản admin
        c.portal.call(_load)  # chạy hàm async trong CÙNG event loop với app
        yield c


def login(client: TestClient, email: str = ADMIN_EMAIL, password: str = ADMIN_PASSWORD) -> dict:
    """Đăng nhập rồi trả header Authorization."""
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


@pytest.fixture
def admin(client):
    return login(client)


@pytest.fixture
def animal_ids(client, admin):
    """Bảng tra id động vật theo tên khoa học (admin thấy cả động vật đang ẩn)."""
    items = client.get("/api/animals", params={"size": 100}, headers=admin).json()["items"]
    return {item["scientific_name"]: item["id"] for item in items}


@pytest.fixture
def poi_by_animal(client, admin):
    """Bảng tra id POI theo id động vật (gồm cả POI của động vật đang ẩn)."""
    return {p["animal_id"]: p["id"] for p in client.get("/api/pois", headers=admin).json()}
