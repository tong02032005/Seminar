"""UC01 – Tra cứu động vật (khách) và UC06 – Quản lý động vật (admin)."""

NEW_ANIMAL = {
    "scientific_name": "Panthera pardus", "zone_id": 2, "category_id": 1, "conservation_status_code": "VU",
    "translations": [{"lang": "vi", "name": "Báo hoa mai"}, {"lang": "en", "name": "Leopard"}],
}


def test_guest_list_hides_hidden_animals(client, animal_ids):
    """Tiêu chí UC01: động vật bị ẩn không có trong danh sách, kết quả lọc, động vật liên quan; mở trực tiếp -> 404."""
    axolotl = animal_ids["Ambystoma mexicanum"]
    items = client.get("/api/animals", params={"size": 100}).json()["items"]
    assert axolotl not in [a["id"] for a in items] and len(items) == 17
    reptiles = client.get("/api/animals", params={"zone_id": 6, "size": 100}).json()["items"]
    assert axolotl not in [a["id"] for a in reptiles]
    related = client.get(f"/api/animals/{animal_ids['Crocodylus siamensis']}/related").json()
    assert axolotl not in [a["id"] for a in related] and len(related) <= 4
    assert client.get(f"/api/animals/{axolotl}").status_code == 404


def test_search_and_filter(client, animal_ids):
    """UC01 bước 3–4: lọc theo tên, nhóm, khu cho kết quả đúng; không có kết quả -> danh sách rỗng."""
    names = [a["name"] for a in client.get("/api/animals", params={"q": "hổ"}).json()["items"]]
    assert "Hổ" in names and all("hổ" in n.lower() for n in names)
    birds = client.get("/api/animals", params={"category_id": 2, "size": 100}).json()["items"]
    assert birds and all(a["category_id"] == 2 for a in birds)
    assert client.get("/api/animals", params={"q": "khongcocon"}).json()["total"] == 0


def test_detail_by_language_with_fallback(client, animal_ids):
    """UC04: nội dung đổi theo ngôn ngữ; mục chưa dịch tiếng Trung thì hiện ngôn ngữ mặc định chứ không để trống."""
    tiger = animal_ids["Panthera tigris"]
    zh = client.get(f"/api/animals/{tiger}", params={"lang": "zh"}).json()
    assert zh["name"] == "老虎" and zh["zone_name"] == "食肉动物区" and zh["appearance"]
    assert zh["poi"]["narration"].startswith("欢迎")
    assert client.get(f"/api/animals/{tiger}", params={"lang": "en"}).json()["name"] == "Tiger"


def test_animal_without_poi_still_visible(client, animal_ids):
    """Động vật chưa có POI vẫn hiện, trang chi tiết không có thuyết minh (poi = null)."""
    ostrich = client.get(f"/api/animals/{animal_ids['Struthio camelus']}").json()
    assert ostrich["poi"] is None


def test_create_update_hide(client, admin):
    """UC06: thêm, sửa, ẩn/hiện. Ẩn thì khách không thấy, admin vẫn thấy."""
    res = client.post("/api/animals", json=NEW_ANIMAL, headers=admin)
    assert res.status_code == 201, res.text
    animal_id = res.json()["id"]
    res = client.patch(f"/api/animals/{animal_id}", json={"available": False,
                       "translations": [{"lang": "zh", "name": "豹"}]}, headers=admin)
    assert res.status_code == 200 and len(res.json()["translations"]) == 3
    assert client.get(f"/api/animals/{animal_id}").status_code == 404
    assert client.get(f"/api/animals/{animal_id}", headers=admin).status_code == 200


def test_create_errors(client, admin):
    """UC06 E1, E2: trùng tên khoa học / tên trong cùng ngôn ngữ -> 409; khu không có -> 404;
    thiếu tên ở ngôn ngữ mặc định -> 422."""
    dup_sci = {**NEW_ANIMAL, "scientific_name": "Panthera tigris"}
    assert client.post("/api/animals", json=dup_sci, headers=admin).status_code == 409
    dup_name = {**NEW_ANIMAL, "translations": [{"lang": "vi", "name": "Hổ"}]}
    assert client.post("/api/animals", json=dup_name, headers=admin).status_code == 409
    assert client.post("/api/animals", json={**NEW_ANIMAL, "zone_id": 999}, headers=admin).status_code == 404
    no_default = {**NEW_ANIMAL, "translations": [{"lang": "en", "name": "Leopard"}]}
    assert client.post("/api/animals", json=no_default, headers=admin).status_code == 422


def test_cannot_delete_animal_with_poi(client, admin, animal_ids, poi_by_animal):
    """Tiêu chí UC06 / PRD 6.3: còn POI -> 409; xóa POI rồi xóa lại thì thành công (bản dịch xóa theo)."""
    tiger = animal_ids["Panthera tigris"]
    res = client.delete(f"/api/animals/{tiger}", headers=admin)
    assert res.status_code == 409 and "xóa POI trước" in res.json()["detail"]
    assert client.delete(f"/api/pois/{poi_by_animal[tiger]}", headers=admin).status_code == 204
    assert client.delete(f"/api/animals/{tiger}", headers=admin).status_code == 204
    assert client.get(f"/api/animals/{tiger}", headers=admin).status_code == 404


def test_upload_invalid_image(client, admin, animal_ids):
    """UC06 E4: file không phải ảnh -> 422."""
    res = client.post(f"/api/animals/{animal_ids['Panthera leo']}/image",
                      files={"file": ("a.png", b"not an image", "image/png")}, headers=admin)
    assert res.status_code == 422
