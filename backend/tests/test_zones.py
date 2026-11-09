"""UC02 – Xem khu vực (khách) và UC07 – Quản lý khu vực (admin)."""

NEW_ZONE = {"color": "#123ABC", "open_hours": "08h00-17h00", "area_m2": 500,
            "contents": [{"lang": "vi", "name": "Khu mới"}, {"lang": "en", "name": "New zone"}]}


def test_list_and_detail(client):
    """UC02: danh sách theo ngôn ngữ kèm số động vật đang hiện; khu không có -> 404."""
    zones = client.get("/api/zones", params={"lang": "zh"}).json()
    reptile = next(z for z in zones if z["name"] == "爬行与水生动物区")
    assert reptile["animal_count"] == 4  # 5 con, 1 con đang ẩn
    assert client.get(f"/api/zones/{reptile['id']}").json()["name"] == "Khu bò sát và thủy sinh"
    assert client.get("/api/zones/999").status_code == 404


def test_create_update_delete(client, admin):
    """UC07: thêm, sửa (thêm tab tiếng Trung), xóa khu trống."""
    res = client.post("/api/zones", json=NEW_ZONE, headers=admin)
    assert res.status_code == 201, res.text
    zone_id = res.json()["id"]
    res = client.patch(f"/api/zones/{zone_id}", json={"color": "#000000",
                       "contents": [{"lang": "zh", "name": "新区"}]}, headers=admin)
    assert res.status_code == 200 and len(res.json()["contents"]) == 3
    assert client.delete(f"/api/zones/{zone_id}", headers=admin).status_code == 204
    assert client.get(f"/api/zones/{zone_id}").status_code == 404


def test_invalid_format_rejected(client, admin):
    """UC07 E1: màu, giờ mở cửa, diện tích sai định dạng -> 422 (Pydantic)."""
    for bad in ({"color": "red"}, {"open_hours": "7h-17h"}, {"area_m2": 0}, {"open_hours": "25h00-17h00"}):
        assert client.post("/api/zones", json={**NEW_ZONE, **bad}, headers=admin).status_code == 422, bad


def test_db_check_constraints_are_second_layer(client):
    """UC07: CHECK trong CSDL vẫn chặn dữ liệu sai nếu đi vòng qua Pydantic."""
    import pytest
    from sqlalchemy import text
    from sqlalchemy.exc import IntegrityError
    from app.core.database import SessionLocal

    async def insert(sql):
        async with SessionLocal() as db:
            await db.execute(text(sql))
            await db.commit()

    for sql in ("INSERT INTO zone (color) VALUES ('red')", "INSERT INTO zone (openHours) VALUES ('7h-17h')",
                "INSERT INTO zone (areaM2) VALUES (-1)"):
        with pytest.raises(IntegrityError):
            client.portal.call(insert, sql)


def test_name_conflict_and_missing_default(client, admin):
    """UC07 E2: tên trùng trong cùng ngôn ngữ -> 409; thiếu tên ở ngôn ngữ mặc định -> 422."""
    dup = {**NEW_ZONE, "contents": [{"lang": "vi", "name": "Khu chim"}]}
    assert client.post("/api/zones", json=dup, headers=admin).status_code == 409
    no_vi = {**NEW_ZONE, "contents": [{"lang": "en", "name": "Only English"}]}
    assert client.post("/api/zones", json=no_vi, headers=admin).status_code == 422


def test_cannot_delete_zone_with_animals(client, admin):
    """Tiêu chí UC07: khu còn động vật -> 409 kèm số lượng."""
    zone = next(z for z in client.get("/api/zones", headers=admin).json() if z["name"] == "Khu chim")
    res = client.delete(f"/api/zones/{zone['id']}", headers=admin)
    assert res.status_code == 409 and "3 động vật" in res.json()["detail"]
