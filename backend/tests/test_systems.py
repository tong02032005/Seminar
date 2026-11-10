"""UC09 – Quản trị hệ thống (thống kê, cài đặt, ngôn ngữ) và UC04 – Đổi ngôn ngữ."""


def test_dashboard_counts(client, admin):
    """Tiêu chí UC09: số liệu khớp dữ liệu mẫu (18 động vật, 1 ẩn, 16 POI, 2 con chưa có POI, 4 POI có thuyết minh)."""
    data = client.get("/api/systems/dashboard", headers=admin).json()
    assert (data["total_animals"], data["visible_animals"], data["hidden_animals"]) == (18, 17, 1)
    assert (data["total_zones"], data["total_pois"], data["animals_without_poi"]) == (5, 16, 2)
    assert data["by_language"][0] == {"lang": "vi", "pois_missing_narration": 0, "pois_missing_audio": 16}


def test_settings_validation(client, admin):
    """UC09 E3: giờ sai / hotline sai / thiếu tên -> 422; E1: ngôn ngữ không có -> 400."""
    put = lambda body: client.put("/api/systems/settings", json=body, headers=admin).status_code  # noqa: E731
    assert put({"open_hours": "17h00-07h00"}) == 422
    assert put({"hotline": "abc"}) == 422
    assert put({"zoo_name": ""}) == 422
    assert put({"default_lang": "fr"}) == 400
    assert put({"open_hours": "08h00-18h00", "default_lang": "en"}) == 200
    assert client.get("/api/systems/public").json()["default_lang"] == "en"


def test_default_language_must_stay_active(client, admin):
    """Tiêu chí UC09: không tắt được ngôn ngữ mặc định; không chọn ngôn ngữ đang tắt làm mặc định."""
    assert client.patch("/api/languages/vi", json={"is_active": False}, headers=admin).status_code == 400
    assert client.patch("/api/languages/zh", json={"is_active": False}, headers=admin).status_code == 200
    assert client.put("/api/systems/settings", json={"default_lang": "zh"}, headers=admin).status_code == 400


def test_disabled_language_hidden_from_guest(client, admin):
    """UC04: ngôn ngữ tắt không hiện cho khách; gửi lang đã tắt thì nhận ngôn ngữ mặc định (E2)."""
    client.patch("/api/languages/zh", json={"is_active": False}, headers=admin)
    assert [lang["code"] for lang in client.get("/api/languages").json()] == ["vi", "en"]
    assert len(client.get("/api/languages", headers=admin).json()) == 3
    assert client.get("/api/zones", params={"lang": "zh"}).json()[0]["name"] == "Khu thú ăn thịt"


def test_lookups_by_language(client):
    """Nhóm động vật và mức bảo tồn đủ 3 ngôn ngữ."""
    assert client.get("/api/categories", params={"lang": "zh"}).json()[0]["name"] == "哺乳动物"
    assert client.get("/api/conservation-statuses", params={"lang": "en"}).json()[2]["name"] == "Critically Endangered"


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}
