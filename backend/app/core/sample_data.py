"""Tầng core – dữ liệu MẪU để chạy thử / demo: khu vực, động vật, vị trí chuồng (POI) và lời thuyết minh 3 ngôn ngữ.

Chạy:  python -m app.core.sample_data            (thêm dữ liệu còn thiếu, tải ảnh còn thiếu từ Wikipedia)
       python -m app.core.sample_data --update   (thêm nữa: ghi đè mô tả 9 mục và lời thuyết minh 3 ngôn ngữ của động vật mẫu)
Mặc định CHỈ THÊM bản ghi còn thiếu, không xóa / không ghi đè dữ liệu đã có:
- khu vực đã có tên tiếng Việt trùng -> bỏ qua
- động vật đã có tên khoa học hoặc tên hiển thị trùng -> bỏ qua
- động vật đã có POI -> bỏ qua
File âm thanh KHÔNG có sẵn: admin tạo bằng nút "Tạo âm thanh" trong trang Quản lý POI, nghe thử rồi lưu (PRD 6.4).
"""
import asyncio
import json
import sys
from decimal import Decimal
from urllib.parse import quote
from urllib.request import Request, urlopen

from fastapi.concurrency import run_in_threadpool

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.animal_details import DETAILS, FIELDS
from app.core.narrations import NARRATIONS
from app.core.database import SessionLocal, engine, init_db
from app.models.animal import Animal, AnimalTranslation
from app.models.category import Category
from app.models.poi import Poi, PoiContent
from app.models.zone import Zone, ZoneContent

# key: (màu, giờ mở cửa, diện tích m2, (tên vi, mô tả vi), (tên en, mô tả en), (tên zh, mô tả zh), tọa độ tâm khu)
ZONES = {
    "carnivore": ("#D84315", "07h30-17h00", "12000",
                  ("Khu thú ăn thịt", "Nơi sinh sống của hổ, sư tử, gấu và các loài săn mồi lớn."),
                  ("Carnivore Zone", "Home to tigers, lions, bears and other large predators."),
                  ("食肉动物区", "老虎、狮子、熊等大型猛兽的家园。"), (10.7892, 106.7040)),
    "primate": ("#6D4C41", "07h00-17h00", "8000",
                ("Khu linh trưởng", "Các loài khỉ, vượn, voọc quý hiếm của Việt Nam và thế giới."),
                ("Primate Zone", "Rare monkeys, gibbons and langurs from Vietnam and around the world."),
                ("灵长类动物区", "来自越南和世界各地的珍稀猴类、长臂猿和叶猴。"), (10.7896, 106.7062)),
    "savanna": ("#F9A825", "07h00-17h30", "25000",
                ("Khu thảo nguyên", "Mô phỏng thảo nguyên châu Phi với voi, hươu cao cổ, ngựa vằn."),
                ("Savanna Zone", "An African savanna setting with elephants, giraffes and zebras."),
                ("草原区", "模拟非洲草原，有大象、长颈鹿和斑马。"), (10.7872, 106.7066)),
    "bird": ("#2E7D32", "06h30-17h00", "6000",
             ("Khu chim", "Vườn chim với công, hồng hạc, đà điểu và nhiều loài chim nhiệt đới."),
             ("Bird Zone", "An aviary with peafowl, flamingos, ostriches and tropical birds."),
             ("鸟类区", "饲养孔雀、火烈鸟、鸵鸟和多种热带鸟类的鸟园。"), (10.7876, 106.7034)),
    "reptile": ("#00838F", "08h00-16h30", "3000",
                ("Khu bò sát và thủy sinh", "Cá sấu, trăn, rắn, lưỡng cư và cá nước ngọt quý hiếm."),
                ("Reptile & Aquatic Zone", "Crocodiles, pythons, snakes, amphibians and rare freshwater fish."),
                ("爬行与水生动物区", "鳄鱼、蟒蛇、毒蛇、两栖动物和珍稀淡水鱼。"), (10.7864, 106.7049)),
}

# (tên khoa học, khu, nhóm, mức bảo tồn, đang hiển thị, độ phổ biến, tên vi, tên en)
# Mô tả 9 mục × 3 ngôn ngữ nằm ở app/core/animal_details.py.
# Kỳ giông Mexico để available=False (đang ẩn): kiểm tra POI của động vật bị ẩn không hiện với khách
ANIMALS = (
    ("Panthera tigris", "carnivore", "mammal", "EN", True, 980, "Hổ", "Tiger"),
    ("Panthera leo", "carnivore", "mammal", "VU", True, 920, "Sư tử", "Lion"),
    ("Ursus thibetanus", "carnivore", "mammal", "VU", True, 540, "Gấu ngựa", "Asian black bear"),
    ("Ailurus fulgens", "carnivore", "mammal", "EN", True, 610, "Gấu trúc đỏ", "Red panda"),
    ("Pygathrix nemaeus", "primate", "mammal", "CR", True, 760, "Voọc chà vá chân nâu", "Red-shanked douc"),
    ("Nomascus leucogenys", "primate", "mammal", "CR", True, 430, "Vượn đen má trắng", "Northern white-cheeked gibbon"),
    ("Elephas maximus", "savanna", "mammal", "EN", True, 890, "Voi châu Á", "Asian elephant"),
    ("Giraffa camelopardalis", "savanna", "mammal", "VU", True, 820, "Hươu cao cổ", "Giraffe"),
    ("Equus quagga", "savanna", "mammal", "NT", True, 650, "Ngựa vằn", "Plains zebra"),
    ("Hippopotamus amphibius", "savanna", "mammal", "VU", True, 580, "Hà mã", "Hippopotamus"),
    ("Pavo muticus", "bird", "bird", "EN", True, 700, "Công lục", "Green peafowl"),
    ("Phoenicopterus roseus", "bird", "bird", "LC", True, 520, "Hồng hạc lớn", "Greater flamingo"),
    ("Struthio camelus", "bird", "bird", "LC", True, 480, "Đà điểu châu Phi", "Common ostrich"),
    ("Crocodylus siamensis", "reptile", "reptile", "CR", True, 600, "Cá sấu Xiêm", "Siamese crocodile"),
    ("Malayopython reticulatus", "reptile", "reptile", "LC", True, 450, "Trăn gấm", "Reticulated python"),
    ("Ophiophagus hannah", "reptile", "reptile", "VU", True, 560, "Rắn hổ mang chúa", "King cobra"),
    ("Ambystoma mexicanum", "reptile", "amphibian", "CR", False, 390, "Kỳ giông Mexico", "Axolotl"),
    ("Scleropages formosus", "reptile", "fish", "EN", True, 410, "Cá rồng châu Á", "Asian arowana"),
)

# Tên tiếng Trung của động vật
ZH_NAMES = {
    "Panthera tigris": "老虎", "Panthera leo": "狮子", "Ursus thibetanus": "亚洲黑熊",
    "Ailurus fulgens": "小熊猫", "Pygathrix nemaeus": "红腿白臀叶猴", "Nomascus leucogenys": "北白颊长臂猿",
    "Elephas maximus": "亚洲象", "Giraffa camelopardalis": "长颈鹿", "Equus quagga": "平原斑马",
    "Hippopotamus amphibius": "河马", "Pavo muticus": "绿孔雀", "Phoenicopterus roseus": "大红鹳",
    "Struthio camelus": "非洲鸵鸟", "Crocodylus siamensis": "暹罗鳄", "Malayopython reticulatus": "网纹蟒",
    "Ophiophagus hannah": "眼镜王蛇", "Ambystoma mexicanum": "墨西哥钝口螈", "Scleropages formosus": "亚洲龙鱼",
}

_IMG = "https://images.unsplash.com/photo-{}?auto=format&fit=crop&w=1200&q=75"
IMAGES = {
    "Panthera tigris": _IMG.format("1561731216-c3a4d99437d5"),
    "Panthera leo": _IMG.format("1546182990-dffeafbe841d"),
    "Elephas maximus": _IMG.format("1557050543-4d5f4e07ef46"),
    "Giraffa camelopardalis": _IMG.format("1547721064-da6cfb341d50"),
    "Equus quagga": _IMG.format("1526095179574-86e545346ae6"),
    "Pygathrix nemaeus": _IMG.format("1540573133985-87b6da6d54a9"),
    "Hippopotamus amphibius": _IMG.format("1535338454770-8be927b5a00b"),
    "Phoenicopterus roseus": _IMG.format("1497206365907-f5e630693df0"),
}

# Chỉ dẫn đường đi theo khu (vi, en, zh)
DIRECTIONS = {
    "carnivore": ("Từ cổng chính đi thẳng, rẽ trái ở ngã ba đầu tiên.",
                  "From the main gate go straight, turn left at the first fork.",
                  "从正门直走，在第一个岔路口左转。"),
    "primate": ("Đi qua khu thú ăn thịt, theo biển chỉ dẫn màu nâu.",
                "Pass the Carnivore Zone and follow the brown signs.",
                "经过食肉动物区，沿棕色指示牌前行。"),
    "savanna": ("Từ cổng chính rẽ phải, đi dọc hồ nước khoảng 200 m.",
                "Turn right at the main gate and walk along the lake for about 200 m.",
                "从正门右转，沿湖边步行约200米。"),
    "bird": ("Cạnh cổng phụ phía tây, gần khu vui chơi trẻ em.",
             "Next to the west side gate, near the children's playground.",
             "位于西侧门旁边，靠近儿童游乐区。"),
    "reptile": ("Phía sau hồ trung tâm, trong nhà kính có mái vòm.",
                "Behind the central lake, inside the domed greenhouse.",
                "在中央湖后面的圆顶温室内。"),
}

POI_ICON = "🐾"

# Động vật CHƯA có POI (để thử: trang chi tiết ghi "Chưa có thuyết minh", thống kê đếm, thêm POI mới)
WITHOUT_POI = {"Struthio camelus", "Scleropages formosus"}

async def _zone_id_by_name(db: AsyncSession, name: str, lang: str) -> int | None:
    """id khu vực có tên này trong ngôn ngữ lang (UNIQUE(lang, name)); không có thì None."""
    return await db.scalar(select(ZoneContent.zone_id).where(ZoneContent.lang == lang, ZoneContent.name == name))


async def _animal_name_taken(db: AsyncSession, name: str, lang: str) -> bool:
    """Tên hiển thị đã có ở động vật nào trong ngôn ngữ lang chưa (UNIQUE(lang, name))."""
    return await db.scalar(select(AnimalTranslation.animal_id).where(
        AnimalTranslation.lang == lang, AnimalTranslation.name == name)) is not None


async def load_sample_data(db: AsyncSession) -> dict[str, int]:
    """Thêm dữ liệu mẫu còn thiếu trong MỘT giao dịch. Trả số bản ghi mới: {"zones", "animals", "pois"}."""
    added = {"zones": 0, "animals": 0, "pois": 0}

    zone_ids = {}
    for key, (color, hours, area, vi, en, zh, _) in ZONES.items():
        zone_id = await _zone_id_by_name(db, vi[0], "vi") or await _zone_id_by_name(db, en[0], "en")
        if zone_id is None:
            zone = Zone(color=color, open_hours=hours, area_m2=Decimal(area))
            db.add(zone)
            await db.flush()  # chờ CSDL cấp zone.id cho nội dung
            zone_id = zone.id
            db.add_all(ZoneContent(zone_id=zone_id, lang=lang, name=c[0], description=c[1])
                       for lang, c in (("vi", vi), ("en", en), ("zh", zh)))
            added["zones"] += 1
        zone_ids[key] = zone_id

    category_ids = dict((await db.execute(select(Category.code, Category.id))).all())
    lang_names = ("vi", "en", "zh")
    for index, (sci, zone, category, status, available, popularity, vi_name, en_name) in enumerate(ANIMALS):
        if (await db.scalar(select(Animal.id).where(Animal.scientific_name == sci)) is not None
                or await _animal_name_taken(db, vi_name, "vi") or await _animal_name_taken(db, en_name, "en")):
            continue
        animal = Animal(scientific_name=sci, zone_id=zone_ids[zone], category_id=category_ids[category],
                        conservation_status_code=status, available=available, popularity=popularity,
                        image=IMAGES.get(sci))
        db.add(animal)
        await db.flush()
        for lang, name in zip(lang_names, (vi_name, en_name, ZH_NAMES[sci])):
            db.add(AnimalTranslation(animal_id=animal.id, lang=lang, name=name, **dict(zip(FIELDS, DETAILS[sci][lang]))))
        added["animals"] += 1
        if sci in WITHOUT_POI:
            continue

        # POI: vị trí chuồng quanh tâm khu (lệch nhẹ theo thứ tự), tên chuồng + chỉ dẫn 3 ngôn ngữ
        lat, lng = ZONES[zone][6]
        poi = Poi(animal_id=animal.id, icon=POI_ICON,
                  latitude=Decimal(str(round(lat + (index % 3 - 1) * 0.0003, 4))),
                  longitude=Decimal(str(round(lng + (index % 4 - 1.5) * 0.0003, 4))))
        db.add(poi)
        await db.flush()
        names = (f"Chuồng {vi_name.lower()}", f"{en_name} enclosure", f"{ZH_NAMES[sci]}馆")
        narrations = NARRATIONS.get(sci, (None, None, None))
        db.add_all(PoiContent(poi_id=poi.id, lang=lang, name=name, direction=direction, narration=narration)
                   for lang, name, direction, narration in zip(lang_names, names, DIRECTIONS[zone], narrations))
        added["pois"] += 1

    await db.commit()  # 1 giao dịch cho toàn bộ dữ liệu mẫu
    return added


async def update_descriptions(db: AsyncSession) -> int:
    """Ghi đè 9 mục mô tả (vi, en, zh) của các động vật mẫu bằng nội dung trong animal_details.py.
    Tên hiển thị giữ nguyên; thiếu bản dịch ngôn ngữ nào thì thêm mới. Trả số động vật đã cập nhật."""
    names = {sci: dict(zip(("vi", "en", "zh"), (vi, en, ZH_NAMES[sci]))) for sci, *_, vi, en in ANIMALS}
    updated = 0
    for sci, by_lang in DETAILS.items():
        animal_id = await db.scalar(select(Animal.id).where(Animal.scientific_name == sci))
        if animal_id is None:
            continue
        for lang, values in by_lang.items():
            tr = await db.get(AnimalTranslation, (animal_id, lang))
            if tr is None:
                if await _animal_name_taken(db, names[sci][lang], lang):
                    continue
                tr = AnimalTranslation(animal_id=animal_id, lang=lang, name=names[sci][lang])
                db.add(tr)
            for field, value in zip(FIELDS, values):
                setattr(tr, field, value)
        updated += 1
    await db.commit()
    return updated


async def update_narrations(db: AsyncSession) -> int:
    """Ghi lời thuyết minh mẫu (vi, en, zh) cho POI của các động vật mẫu. Lời nào thay đổi thì xóa file âm thanh
    cũ của ngôn ngữ đó (như khi admin sửa lời, PRD 6.4). Thiếu nội dung ngôn ngữ nào thì thêm mới. Trả số POI."""
    names = {sci: (f"Chuồng {vi.lower()}", f"{en} enclosure", f"{ZH_NAMES[sci]}馆") for sci, *_, vi, en in ANIMALS}
    old_files, updated = [], 0
    for sci, texts in NARRATIONS.items():
        poi = await db.scalar(select(Poi).join(Animal, Animal.id == Poi.animal_id).where(Animal.scientific_name == sci))
        if poi is None:
            continue
        if poi.icon in (None, "", "paw"):
            poi.icon = POI_ICON
        for lang, name, text in zip(("vi", "en", "zh"), names[sci], texts):
            content = await db.get(PoiContent, (poi.id, lang))
            if content is None:
                db.add(PoiContent(poi_id=poi.id, lang=lang, name=name, narration=text))
                continue
            if content.narration != text:
                content.narration, content.narration_source = text, "manual"
                if content.audio_file:
                    old_files.append(content.audio_file)
                    content.audio_file = None
        updated += 1
    await db.commit()
    for url in old_files:  # sau khi commit mới xóa file, lỗi giữa chừng thì không mất âm thanh
        (config.AUDIO_DIR / url.rsplit("/", 1)[-1]).unlink(missing_ok=True)
    return updated


_WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"
_HEADERS = {"User-Agent": "ZooGuideSeminar/1.0 (student project; python-urllib)"}


def _download_wiki_image(scientific_name: str) -> str | None:
    """Lấy ảnh đại diện bài Wikipedia của loài (tra theo tên khoa học), tải về static/uploads/animals.
    Trả đường dẫn /static/... hoặc None nếu không lấy được (không có mạng, bài không có ảnh...)."""
    try:
        with urlopen(Request(_WIKI_SUMMARY + quote(scientific_name.replace(" ", "_")), headers=_HEADERS),
                     timeout=20) as response:
            summary = json.loads(response.read().decode("utf-8"))
        original = summary.get("originalimage") or {}
        thumb = (summary.get("thumbnail") or {}).get("source")
        url = original.get("source")
        if thumb and original.get("width", 0) > 960 and "px-" in thumb:
            head, tail = thumb.rsplit("/", 1)  # .../320px-File.jpg -> .../960px-File.jpg
            url = f"{head}/960px-{tail.split('px-', 1)[1]}"
        if not url:
            return None
        with urlopen(Request(url, headers=_HEADERS), timeout=30) as response:
            data = response.read()
        ext = url.rsplit(".", 1)[-1].lower()
        ext = ext if ext in ("jpg", "jpeg", "png", "webp", "gif") else "jpg"
        folder = config.UPLOAD_DIR / "animals"
        folder.mkdir(parents=True, exist_ok=True)
        filename = f"wiki_{scientific_name.lower().replace(' ', '_')}.{ext}"
        (folder / filename).write_bytes(data)
        return f"/static/uploads/animals/{filename}"
    except Exception as exc:  # thiếu ảnh không phải lỗi nghiêm trọng: báo rồi bỏ qua
        print(f"  ! Không lấy được ảnh cho {scientific_name}: {exc}")
        return None


async def fill_missing_images(db: AsyncSession) -> int:
    """Động vật chưa có ảnh: tải ảnh từ Wikipedia (cần Internet). Trả số ảnh đã thêm."""
    animals = (await db.scalars(select(Animal).where(Animal.image.is_(None)))).all()
    added = 0
    for animal in animals:
        path = await run_in_threadpool(_download_wiki_image, animal.scientific_name)
        if path:
            animal.image = path
            added += 1
            print(f"  + Ảnh cho {animal.scientific_name}")
    await db.commit()
    return added


async def _main(update: bool) -> None:
    """Chạy từ dòng lệnh: seed dữ liệu mặc định, nạp dữ liệu mẫu, (tùy chọn) cập nhật mô tả, tải ảnh còn thiếu."""
    await init_db()
    async with SessionLocal() as session:
        result = await load_sample_data(session)
        print(f"Đã thêm {result['zones']} khu vực, {result['animals']} động vật, {result['pois']} POI. "
              "Dữ liệu đã có được giữ nguyên.")
        if update:
            print(f"Đã cập nhật mô tả 3 ngôn ngữ cho {await update_descriptions(session)} động vật.")
            print(f"Đã cập nhật lời thuyết minh 3 ngôn ngữ cho {await update_narrations(session)} POI "
                  "(lời thay đổi thì âm thanh cũ bị xóa, hãy bấm Tạo âm thanh lại).")
        print("Đang tải ảnh còn thiếu từ Wikipedia...")
        print(f"Đã thêm ảnh cho {await fill_missing_images(session)} động vật.")
    await engine.dispose()


if __name__ == "__main__":
    # python -m app.core.sample_data            -> thêm dữ liệu mẫu còn thiếu + tải ảnh còn thiếu
    # python -m app.core.sample_data --update   -> thêm nữa: GHI ĐÈ mô tả và lời thuyết minh của động vật mẫu
    asyncio.run(_main("--update" in sys.argv))
