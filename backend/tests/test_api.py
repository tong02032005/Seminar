def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_list_animals_camel_case_without_audio(client):
    animals = client.get("/api/animals").json()
    assert len(animals) == 13
    first = animals[0]
    assert first["popularity"] == max(a["popularity"] for a in animals)
    assert {"scientificName", "conservationStatus", "zoneName", "qrCode"} <= first.keys()
    assert not any(k.startswith("audio") for k in first)
    assert "aliases" not in first


def test_filter_and_search_without_diacritics(client):
    res = client.get("/api/animals", params={"search": "ho bengal"}).json()
    assert [a["name"] for a in res] == ["Hổ Bengal"]
    birds = client.get("/api/animals", params={"category": "birds"}).json()
    assert all(a["category"] == "birds" for a in birds) and birds


def test_animal_detail_qr_and_related(client):
    assert client.get("/api/animals/1").json()["name"] == "Hổ Bengal"
    assert client.get("/api/animals/qr/zoo-003").json()["id"] == 3
    assert client.get("/api/animals/qr/ZOO-999").status_code == 404
    related = client.get("/api/animals/1/related", params={"limit": 2}).json()
    assert len(related) == 2 and all(a["id"] != 1 for a in related)


def test_zones_include_animals(client):
    zones = client.get("/api/zones").json()
    asia = next(z for z in zones if z["id"] == "asia")
    assert asia["animalCount"] == 4
    detail = client.get("/api/zones/asia").json()
    assert len(detail["animals"]) == 4


def test_login_errors(client):
    assert client.post("/api/auth/login", json={"email": "admin@zooguide.vn", "password": "x"}).status_code == 401
    locked = client.post("/api/auth/login", json={"email": "thuha@example.com", "password": "123456"})
    assert locked.status_code == 403


def test_register_and_me(client):
    payload = {"fullName": "Khách Mới", "email": "moi@example.com", "password": "abcdef"}
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert "passwordHash" not in body["user"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.json()["email"] == "moi@example.com"
    dup = client.post("/api/auth/register", json={"fullName": "X Y", "email": "MOI@example.com", "password": "abcdef"})
    assert dup.status_code == 400


def test_admin_routes_require_admin(client, user_headers):
    assert client.get("/api/users").status_code == 401
    assert client.get("/api/users", headers=user_headers).status_code == 403


def test_animal_crud(client, admin_headers):
    payload = {"name": "Gấu ngựa", "scientificName": "Ursus thibetanus", "zone": "asia",
               "description": "Gấu ngựa có vệt lông trắng hình chữ V trước ngực."}
    created = client.post("/api/animals", json=payload, headers=admin_headers)
    assert created.status_code == 201
    animal = created.json()
    assert animal["qrCode"] == f"ZOO-{animal['id']:03d}"

    updated = client.put(f"/api/animals/{animal['id']}", json={**animal, "diet": "Quả, mật ong"}, headers=admin_headers)
    assert updated.json()["diet"] == "Quả, mật ong"

    bad_zone = client.put(f"/api/animals/{animal['id']}", json={**animal, "zone": "moon"}, headers=admin_headers)
    assert bad_zone.status_code == 404

    assert client.delete(f"/api/animals/{animal['id']}", headers=admin_headers).status_code == 204
    assert client.get(f"/api/animals/{animal['id']}").status_code == 404


def test_zone_cannot_be_deleted_with_animals(client, admin_headers):
    assert client.delete("/api/zones/asia", headers=admin_headers).status_code == 400


def test_review_flow(client, user_headers, admin_headers):
    res = client.post("/api/reviews", json={"animalId": 2, "rating": 5, "comment": "Sư tử rất oai vệ và khỏe."},
                      headers=user_headers)
    assert res.status_code == 201
    review = res.json()
    assert review["status"] == "pending" and review["animalName"] == "Sư tử châu Phi"

    public = client.get("/api/reviews", params={"animal_id": 2}).json()
    assert review["id"] not in [r["id"] for r in public]

    mine = client.get("/api/reviews", params={"user_id": review["userId"]}, headers=user_headers).json()
    assert review["id"] in [r["id"] for r in mine]

    client.patch(f"/api/reviews/{review['id']}", json={"status": "approved"}, headers=admin_headers)
    public = client.get("/api/reviews", params={"animal_id": 2}).json()
    assert review["id"] in [r["id"] for r in public]


def test_auto_approve_setting(client, user_headers, admin_headers):
    settings = client.get("/api/admin/settings", headers=admin_headers).json()
    client.put("/api/admin/settings", json={**settings, "autoApprove": True}, headers=admin_headers)
    res = client.post("/api/reviews", json={"animalId": 1, "rating": 4, "comment": "Hổ đẹp, thông tin hay."},
                      headers=user_headers)
    assert res.json()["status"] == "approved"


def test_dashboard_stats(client, admin_headers):
    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["animals"] == 13 and stats["pendingReviews"] == 2
    assert sum(z["value"] for z in stats["animalsByZone"]) == 13
    assert "audioPlays" not in stats


def test_admin_cannot_lock_self(client, admin_headers):
    assert client.patch("/api/users/1", json={"status": "locked"}, headers=admin_headers).status_code == 400
    assert client.patch("/api/users/3", json={"status": "locked"}, headers=admin_headers).json()["status"] == "locked"


def test_chatbot(client):
    assert "Hổ Bengal" in client.post("/api/chat", json={"message": "Hổ ăn gì?"}).json()["text"]
    where = client.post("/api/chat", json={"message": "Voi ở đâu?"}).json()
    assert where["link"]["to"] == "/map?focus=asia"
    assert "7:30" in client.post("/api/chat", json={"message": "Giờ mở cửa?"}).json()["text"]
    assert client.get("/api/chat/suggestions").json()


def test_cors_allows_any_localhost_port(client):
    res = client.get("/api/health", headers={"Origin": "http://localhost:5174"})
    assert res.headers["access-control-allow-origin"] == "http://localhost:5174"
    res = client.get("/api/health", headers={"Origin": "http://evil.example.com"})
    assert "access-control-allow-origin" not in res.headers
