"""Xuất dữ liệu cho BẢN TĨNH (chạy trên điện thoại, không cần server).

Gọi đúng các API khách đang dùng rồi lưu kết quả thành file JSON, chép ảnh + mp3 sang
frontend/static-site/. Sau đó build frontend ở chế độ static (npm run build:static) là có thư mục
dist/ đưa lên GitHub Pages / Netlify. Chỉ có phần khách xem, không có trang admin.

Chạy (trong thư mục backend, đã bật .venv):  python -m app.core.export_static
"""
import json
import shutil
import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.core import config
from app.main import app

OUT = Path(__file__).resolve().parents[3] / "frontend" / "static-site"
PUBLIC = OUT.parent / "public"


def _write(folder: str, bundle: dict) -> None:
    """Mỗi ngôn ngữ gộp thành MỘT file data/<lang>.json {"animals/3": {...}, ...} để ít file, dễ tải lên web."""
    path = OUT / "data" / f"{folder}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(bundle, ensure_ascii=False), encoding="utf-8")


def _get(client: TestClient, url: str, **params):
    res = client.get(url, params=params)
    res.raise_for_status()
    return res.json()


def export() -> dict[str, int]:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    with TestClient(app) as client:
        langs = [lang["code"] for lang in _get(client, "/api/languages")]
        counts = {"languages": len(langs), "animals": 0, "pois": 0}
        # "default" = gọi không kèm lang (backend dùng ngôn ngữ mặc định)
        for folder, lang in [("default", None), *[(code, code) for code in langs]]:
            q = {"lang": lang} if lang else {}
            bundle = {}
            _save = bundle.__setitem__  # bundle["animals/3"] = dữ liệu của GET /api/animals/3
            _save("systems/public", _get(client, "/api/systems/public"))
            _save("languages", _get(client, "/api/languages"))
            _save("categories", _get(client, "/api/categories", **q))
            _save("conservation-statuses", _get(client, "/api/conservation-statuses", **q))

            animals, page = [], 1
            while True:
                data = _get(client, "/api/animals", page=page, size=100, **q)
                animals += data["items"]
                if len(animals) >= data["total"]:
                    break
                page += 1
            _save("animals", animals)  # cả danh sách; tìm/lọc/sắp xếp làm ở trình duyệt
            for animal in animals:
                _save(f"animals/{animal['id']}", _get(client, f"/api/animals/{animal['id']}", **q))
                _save(f"animals/{animal['id']}/related",
                      _get(client, f"/api/animals/{animal['id']}/related", **q))

            zones = _get(client, "/api/zones", **q)
            _save("zones", zones)
            for zone in zones:
                _save(f"zones/{zone['id']}", _get(client, f"/api/zones/{zone['id']}", **q))

            pois = _get(client, "/api/pois", **q)
            _save("pois", pois)
            for poi in pois:
                _save(f"pois/{poi['id']}", _get(client, f"/api/pois/{poi['id']}", **q))
            counts["animals"], counts["pois"] = len(animals), len(pois)
            _write(folder, bundle)

    shutil.copytree(config.STATIC_DIR, OUT / "static",
                    ignore=shutil.ignore_patterns("*.tmp", ".gitkeep"))  # ảnh + mp3 đã lưu
    for item in PUBLIC.iterdir():  # favicon... của thư mục public
        shutil.copy2(item, OUT / item.name) if item.is_file() else None
    return counts


if __name__ == "__main__":
    result = export()
    print(f"Đã xuất {result['languages']} ngôn ngữ, {result['animals']} động vật, {result['pois']} POI vào {OUT}")
    print("Tiếp theo (thư mục frontend): npm run build:static  -> thư mục dist-static/ để đưa lên web")
    sys.exit(0)
