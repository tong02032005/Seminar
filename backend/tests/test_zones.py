"""UC02 – Xem khu vực (khách) và UC07 – Quản lý khu vực (admin)."""

def test_list_and_detail(client):
    """UC02: danh sách theo ngôn ngữ kèm số động vật đang hiện; khu không có -> 404."""
    zones = client.get("/api/zones", params={"lang": "zh"}).json()
    reptile = next(z for z in zones if z["name"] == "爬行与水生动物区")
    assert reptile["animal_count"] == 4  # 5 con, 1 con đang ẩn
    assert client.get(f"/api/zones/{reptile['id']}").json()["name"] == "Khu bò sát và thủy sinh"
    assert client.get("/api/zones/999").status_code == 404


def test_zones_are_fixed(client, admin):
    """UC07: 5 khu cố định – không có API thêm/xóa (405); vẫn sửa được (thêm tab tiếng Trung); không còn diện tích."""
    zones = client.get("/api/zones", headers=admin).json()
    assert len(zones) == 5 and all("area_m2" not in z for z in zones)
    zone_id = zones[0]["id"]
    assert client.post("/api/zones", json={"contents": [{"lang": "vi", "name": "Khu mới"}]}, headers=admin).status_code == 405
    assert client.delete(f"/api/zones/{zone_id}", headers=admin).status_code == 405
    res = client.patch(f"/api/zones/{zone_id}", json={"color": "#000000",
                       "contents": [{"lang": "zh", "name": "新区"}]}, headers=admin)
    assert res.status_code == 200 and res.json()["color"] == "#000000"


def test_invalid_format_rejected(client, admin):
    """UC07 E1: màu, giờ mở cửa sai định dạng -> 422 (Pydantic)."""
    zone_id = client.get("/api/zones").json()[0]["id"]
    for bad in ({"color": "red"}, {"open_hours": "7h-17h"}, {"open_hours": "25h00-17h00"}):
        assert client.patch(f"/api/zones/{zone_id}", json=bad, headers=admin).status_code == 422, bad


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

    for sql in ("INSERT INTO zone (color) VALUES ('red')", "INSERT INTO zone (openHours) VALUES ('7h-17h')"):
        with pytest.raises(IntegrityError):
            client.portal.call(insert, sql)


def test_name_conflict(client, admin):
    """UC07 E2: đổi tên trùng tên khu khác trong cùng ngôn ngữ -> 409."""
    zones = client.get("/api/zones", params={"lang": "vi"}).json()
    other = next(z for z in zones if z["name"] != "Khu chim")
    dup = {"contents": [{"lang": "vi", "name": "Khu chim"}]}
    assert client.patch(f"/api/zones/{other['id']}", json=dup, headers=admin).status_code == 409
