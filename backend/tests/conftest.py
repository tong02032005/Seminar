import os
import tempfile
from pathlib import Path

import pytest

# Dùng file dữ liệu tạm để test không ghi đè backend/data/db.json
os.environ["ZOOGUIDE_DATA_FILE"] = str(Path(tempfile.mkdtemp()) / "db.json")

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402


@pytest.fixture()
def client():
    main.store.reset()
    return TestClient(main.app)


def _token(client, email, password):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture()
def admin_headers(client):
    return _token(client, "admin@zooguide.vn", "admin123")


@pytest.fixture()
def user_headers(client):
    return _token(client, "user@zooguide.vn", "user123")
