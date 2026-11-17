"""UC02/UC03 – Bản đồ và nghe thuyết minh (khách); UC08 – Quản lý POI và thuyết minh (admin)."""
from pathlib import Path

from app.core import config


def _saved_file(url: str) -> Path:
    """File mp3 đã lưu trên đĩa ứng với audio_url (test ghi vào thư mục tạm config.AUDIO_DIR)."""
    return config.AUDIO_DIR / Path(url).name


def _new_poi(animal_id, **extra):
    return {"animal_id": animal_id, "latitude": 10.7881, "longitude": 106.7051,
            "contents": [{"lang": "vi", "name": "Chuồng đà điểu", "narration": "Đà điểu chạy rất nhanh."}], **extra}


def test_hidden_animal_poi_not_on_map(client, admin, animal_ids, poi_by_animal):
    """Tiêu chí UC02: POI của động vật bị ẩn không hiện; ẩn thêm con nữa thì POI của nó cũng biến mất."""
    guest = [p["id"] for p in client.get("/api/pois").json()]
    axolotl_poi = poi_by_animal[animal_ids["Ambystoma mexicanum"]]
    assert axolotl_poi not in guest and len(guest) == 15
    assert client.get(f"/api/pois/{axolotl_poi}").status_code == 404
    lion = animal_ids["Panthera leo"]
    client.patch(f"/api/animals/{lion}", json={"available": False}, headers=admin)
    assert poi_by_animal[lion] not in [p["id"] for p in client.get("/api/pois").json()]


def test_filter_by_zone(client):
    """UC02 A1: lọc theo khu chỉ hiện đúng POI của khu đó."""
    pois = client.get("/api/pois", params={"zone_id": 3}).json()
    assert pois and all(p["zone_id"] == 3 for p in pois)


def test_one_poi_per_animal(client, admin, animal_ids):
    """Tiêu chí UC08: mỗi động vật chỉ có 1 POI (409); động vật không có -> 404; tọa độ sai -> 422;
    thiếu nội dung ngôn ngữ mặc định -> 422."""
    ostrich = animal_ids["Struthio camelus"]
    assert client.post("/api/pois", json=_new_poi(ostrich), headers=admin).status_code == 201
    assert client.post("/api/pois", json=_new_poi(ostrich), headers=admin).status_code == 409
    assert client.post("/api/pois", json=_new_poi(9999), headers=admin).status_code == 404
    arowana = animal_ids["Scleropages formosus"]
    assert client.post("/api/pois", json=_new_poi(arowana, latitude=91), headers=admin).status_code == 422
    no_vi = _new_poi(arowana, contents=[{"lang": "en", "name": "Arowana tank"}])
    assert client.post("/api/pois", json=no_vi, headers=admin).status_code == 422


def test_poi_position_not_duplicated(client, admin, animal_ids, poi_by_animal):
    """Hai chuồng không được trùng vị trí (cách < 15 m) -> 409, cả khi thêm lẫn khi sửa."""
    lion = client.get(f"/api/pois/{poi_by_animal[animal_ids['Panthera leo']]}").json()
    near = {"latitude": lion["latitude"] + 0.00005, "longitude": lion["longitude"]}  # ~5 m
    ostrich = animal_ids["Struthio camelus"]
    res = client.post("/api/pois", json=_new_poi(ostrich, **near), headers=admin)
    assert res.status_code == 409 and "trùng" in res.json()["detail"]
    tiger_poi = poi_by_animal[animal_ids["Panthera tigris"]]
    assert client.patch(f"/api/pois/{tiger_poi}", json=near, headers=admin).status_code == 409
    # giữ nguyên vị trí của chính nó thì vẫn lưu được
    tiger = client.get(f"/api/pois/{tiger_poi}").json()
    same = {"latitude": tiger["latitude"], "longitude": tiger["longitude"]}
    assert client.patch(f"/api/pois/{tiger_poi}", json=same, headers=admin).status_code == 200


def test_translate(client, admin):
    """UC08 A1: dịch sang 2 ngôn ngữ còn lại, chỉ trả kết quả; lời trống -> 422."""
    res = client.post("/api/translate", json={"text": "Xin chào", "source_lang": "vi"}, headers=admin)
    assert res.json() == {"translations": {"en": "[en] Xin chào", "zh": "[zh] Xin chào"}}
    assert client.post("/api/translate", json={"text": "  ", "source_lang": "vi"}, headers=admin).status_code == 422


def test_service_down_returns_503(client, admin, monkeypatch, animal_ids, poi_by_animal):
    """UC08 E3: dịch vụ dịch / giọng đọc lỗi -> 503, dữ liệu không đổi."""
    from app.services import narration_service

    async def broken(*args, **kwargs):
        raise ConnectionError("mất mạng")

    monkeypatch.setattr(narration_service, "translate", broken)
    monkeypatch.setattr(narration_service, "synthesize", broken)
    res = client.post("/api/translate", json={"text": "Xin chào", "source_lang": "vi"}, headers=admin)
    assert res.status_code == 503 and res.json()["detail"].startswith("Dịch vụ tạm thời không dùng được, hãy thử lại sau")
    poi = poi_by_animal[animal_ids["Panthera tigris"]]
    assert client.post(f"/api/pois/{poi}/audio/preview", params={"lang": "vi"}, headers=admin).status_code == 503


def test_audio_preview_then_save(client, admin, animal_ids, poi_by_animal):
    """Tiêu chí UC08/UC03: file nháp không đến khách; chỉ file đã lưu mới phát cho khách."""
    poi = poi_by_animal[animal_ids["Panthera tigris"]]
    res = client.post(f"/api/pois/{poi}/audio/preview", params={"lang": "vi"}, headers=admin)
    assert res.status_code == 201, res.text
    draft = res.json()["draft_id"]
    # admin nghe thử được (có token); khách không có token -> 401; khách vẫn chưa có audio_url
    assert client.get(f"/api/pois/{poi}/audio/preview/{draft}", headers=admin).content.startswith(b"ID3")
    assert client.get(f"/api/pois/{poi}/audio/preview/{draft}").status_code == 401
    assert client.get(f"/api/pois/{poi}", params={"lang": "vi"}).json()["audio_url"] is None
    # Tạo lại -> file nháp mới; lưu file nháp đó
    draft2 = client.post(f"/api/pois/{poi}/audio/preview", params={"lang": "vi"}, headers=admin).json()["draft_id"]
    assert draft2 != draft
    res = client.put(f"/api/pois/{poi}/audio", params={"lang": "vi"}, json={"draft_id": draft2}, headers=admin)
    assert res.status_code == 200, res.text
    url = client.get(f"/api/pois/{poi}", params={"lang": "vi"}).json()["audio_url"]
    assert url == f"/static/audio/{draft2}.mp3"
    assert _saved_file(url).exists()  # file chính nằm trong thư mục phục vụ /static/audio
    # tiếng Anh chưa có file -> audio_url None (khách thấy "Chưa có âm thanh")
    assert client.get(f"/api/pois/{poi}", params={"lang": "en"}).json()["audio_url"] is None
    # lưu nháp của ngôn ngữ khác / mã bịa -> 404
    assert client.put(f"/api/pois/{poi}/audio", params={"lang": "en"}, json={"draft_id": draft}, headers=admin).status_code == 404
    assert client.put(f"/api/pois/{poi}/audio", params={"lang": "vi"}, json={"draft_id": "../x"}, headers=admin).status_code == 404


def test_preview_errors(client, admin, animal_ids, poi_by_animal):
    """UC08 E2: chưa có lời thuyết minh -> 422; ngôn ngữ đang tắt -> 400."""
    lion_poi = poi_by_animal[animal_ids["Panthera leo"]]
    # xóa lời thuyết minh tiếng Việt của sư tử
    client.patch(f"/api/pois/{lion_poi}", json={"contents": [{"lang": "vi", "name": "Chuồng sư tử", "narration": None}]},
                 headers=admin)
    assert client.post(f"/api/pois/{lion_poi}/audio/preview", params={"lang": "vi"}, headers=admin).status_code == 422
    client.patch("/api/languages/zh", json={"is_active": False}, headers=admin)
    tiger_poi = poi_by_animal[animal_ids["Panthera tigris"]]
    assert client.post(f"/api/pois/{tiger_poi}/audio/preview", params={"lang": "zh"}, headers=admin).status_code == 400


def test_edit_narration_clears_audio(client, admin, animal_ids, poi_by_animal):
    """Tiêu chí UC08 A3: sửa lời thuyết minh -> xóa file cũ, audio_url = None; sửa chỉ dẫn thì giữ file."""
    poi = poi_by_animal[animal_ids["Panthera tigris"]]
    draft = client.post(f"/api/pois/{poi}/audio/preview", params={"lang": "vi"}, headers=admin).json()["draft_id"]
    client.put(f"/api/pois/{poi}/audio", params={"lang": "vi"}, json={"draft_id": draft}, headers=admin)
    vi = next(c for c in client.get(f"/api/pois/{poi}/admin", headers=admin).json()["contents"] if c["lang"] == "vi")
    same_text = {**vi, "direction": "Đường mới"}
    client.patch(f"/api/pois/{poi}", json={"contents": [same_text]}, headers=admin)
    url = client.get(f"/api/pois/{poi}").json()["audio_url"]
    assert url is not None
    client.patch(f"/api/pois/{poi}", json={"contents": [{**vi, "narration": "Lời mới"}]}, headers=admin)
    assert client.get(f"/api/pois/{poi}").json()["audio_url"] is None
    assert not _saved_file(url).exists()  # file cũ đã bị xóa


def test_delete_poi_removes_contents_and_audio(client, admin, animal_ids, poi_by_animal):
    """UC08 A4: xóa POI -> xóa nội dung (CASCADE) và file âm thanh."""
    poi = poi_by_animal[animal_ids["Panthera tigris"]]
    draft = client.post(f"/api/pois/{poi}/audio/preview", params={"lang": "vi"}, headers=admin).json()["draft_id"]
    client.put(f"/api/pois/{poi}/audio", params={"lang": "vi"}, json={"draft_id": draft}, headers=admin)
    url = client.get(f"/api/pois/{poi}").json()["audio_url"]
    assert client.delete(f"/api/pois/{poi}", headers=admin).status_code == 204
    assert client.get(f"/api/pois/{poi}", headers=admin).status_code == 404
    assert not _saved_file(url).exists()
