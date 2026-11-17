"""Tầng core – dữ liệu mặc định thêm lúc khởi động app (PRD 6.4).

Chỉ thêm bản ghi còn thiếu, không ghi đè dữ liệu admin đã sửa, nên chạy lại nhiều lần vẫn an toàn.
"""
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.security import hash_password
from app.models.admin_account import AdminAccount
from app.models.category import Category, CategoryTranslation
from app.models.conservation_status import ConservationStatus, ConservationStatusTranslation
from app.models.language import Language
from app.models.settings import SystemSettings
from app.models.zone import Zone, ZoneContent

LANGUAGES = (("vi", "Tiếng Việt"), ("en", "English"), ("zh", "中文"))

# (mã IUCN, màu, tên vi, tên en, tên zh)
CONSERVATION_STATUSES = (
    ("EX", "#000000", "Tuyệt chủng", "Extinct", "灭绝"),
    ("EW", "#542344", "Tuyệt chủng trong tự nhiên", "Extinct in the Wild", "野外灭绝"),
    ("CR", "#D81E05", "Cực kỳ nguy cấp", "Critically Endangered", "极危"),
    ("EN", "#FC7F3F", "Nguy cấp", "Endangered", "濒危"),
    ("VU", "#F9E814", "Sắp nguy cấp", "Vulnerable", "易危"),
    ("NT", "#CCE226", "Sắp bị đe dọa", "Near Threatened", "近危"),
    ("LC", "#60C659", "Ít quan tâm", "Least Concern", "无危"),
    ("DD", "#D1D1C6", "Thiếu dữ liệu", "Data Deficient", "数据缺乏"),
    ("NE", "#FFFFFF", "Chưa đánh giá", "Not Evaluated", "未评估"),
)

# (code, tên vi, tên en, tên zh)
CATEGORIES = (
    ("mammal", "Thú", "Mammals", "哺乳动物"),
    ("bird", "Chim", "Birds", "鸟类"),
    ("reptile", "Bò sát", "Reptiles", "爬行动物"),
    ("amphibian", "Lưỡng cư", "Amphibians", "两栖动物"),
    ("fish", "Cá", "Fish", "鱼类"),
    ("invertebrate", "Không xương sống", "Invertebrates", "无脊椎动物"),
)

# 5 KHU CỐ ĐỊNH (admin không thêm/xóa được, chỉ sửa tên, mô tả, màu, giờ, ảnh).
# Thứ tự = vị trí cố định trên bản đồ tổng (frontend ZooMap ZONE_SLOTS): tây bắc, bắc, đông bắc, tây nam, đông nam.
# key: (màu, giờ mở cửa, (tên vi, mô tả vi), (tên en, mô tả en), (tên zh, mô tả zh))
FIXED_ZONES = {
    "carnivore": ("#D84315", "07h30-17h00",
                  ("Khu thú ăn thịt", "Nơi sinh sống của hổ, sư tử, gấu và các loài săn mồi lớn."),
                  ("Carnivore Zone", "Home to tigers, lions, bears and other large predators."),
                  ("食肉动物区", "老虎、狮子、熊等大型猛兽的家园。")),
    "primate": ("#6D4C41", "07h00-17h00",
                ("Khu linh trưởng", "Các loài khỉ, vượn, voọc quý hiếm của Việt Nam và thế giới."),
                ("Primate Zone", "Rare monkeys, gibbons and langurs from Vietnam and around the world."),
                ("灵长类动物区", "来自越南和世界各地的珍稀猴类、长臂猿和叶猴。")),
    "savanna": ("#F9A825", "07h00-17h30",
                ("Khu thảo nguyên", "Mô phỏng thảo nguyên châu Phi với voi, hươu cao cổ, ngựa vằn."),
                ("Savanna Zone", "An African savanna setting with elephants, giraffes and zebras."),
                ("草原区", "模拟非洲草原，有大象、长颈鹿和斑马。")),
    "bird": ("#2E7D32", "06h30-17h00",
             ("Khu chim", "Vườn chim với công, hồng hạc, đà điểu và nhiều loài chim nhiệt đới."),
             ("Bird Zone", "An aviary with peafowl, flamingos, ostriches and tropical birds."),
             ("鸟类区", "饲养孔雀、火烈鸟、鸵鸟和多种热带鸟类的鸟园。")),
    "reptile": ("#00838F", "08h00-16h30",
                ("Khu bò sát và thủy sinh", "Cá sấu, trăn, rắn, lưỡng cư và cá nước ngọt quý hiếm."),
                ("Reptile & Aquatic Zone", "Crocodiles, pythons, snakes, amphibians and rare freshwater fish."),
                ("爬行与水生动物区", "鳄鱼、蟒蛇、毒蛇、两栖动物和珍稀淡水鱼。")),
}

_LANG_CODES = ("vi", "en", "zh")


async def seed(db: AsyncSession) -> None:
    """Thêm ngôn ngữ, mức bảo tồn, nhóm động vật, cài đặt, 5 khu cố định và tài khoản admin duy nhất."""
    langs = set(await db.scalars(select(Language.code)))
    db.add_all(Language(code=c, name=n) for c, n in LANGUAGES if c not in langs)
    await db.flush()  # ngôn ngữ phải có trước vì các bảng dịch tham chiếu language.code

    statuses = set(await db.scalars(select(ConservationStatus.code)))
    for code, color, *names in CONSERVATION_STATUSES:
        if code not in statuses:
            db.add(ConservationStatus(code=code, color=color))
            db.add_all(ConservationStatusTranslation(status_code=code, lang=lang, name=name)
                       for lang, name in zip(_LANG_CODES, names))

    categories = set(await db.scalars(select(Category.code)))
    for code, *names in CATEGORIES:
        if code not in categories:
            category = Category(code=code)
            db.add(category)
            await db.flush()  # chờ CSDL cấp category.id cho bản dịch
            db.add_all(CategoryTranslation(category_id=category.id, lang=lang, name=name)
                       for lang, name in zip(_LANG_CODES, names))

    if await db.get(SystemSettings, 1) is None:
        db.add(SystemSettings(id=1, zoo_name="ZooGuide", open_hours="07h00-17h00",
                              hotline="1900 1234", default_lang="vi"))

    # 5 khu cố định, tạo theo đúng thứ tự (id tăng dần = vị trí trên bản đồ tổng)
    if await db.scalar(select(Zone.id).limit(1)) is None:
        for color, hours, *contents in FIXED_ZONES.values():
            zone = Zone(color=color, open_hours=hours)
            db.add(zone)
            await db.flush()  # chờ CSDL cấp zone.id cho nội dung
            db.add_all(ZoneContent(zone_id=zone.id, lang=lang, name=name, description=desc)
                       for lang, (name, desc) in zip(_LANG_CODES, contents))
    await db.flush()

    # Tài khoản admin duy nhất: chỉ tạo khi bảng còn trống (đổi mật khẩu rồi khởi động lại không bị ghi đè)
    if config.ADMIN_EMAIL and config.ADMIN_PASSWORD and await db.scalar(select(AdminAccount.id).limit(1)) is None:
        # run_in_threadpool: băm mật khẩu nặng CPU, không chạy thẳng trong event loop
        password_hash = await run_in_threadpool(hash_password, config.ADMIN_PASSWORD)
        db.add(AdminAccount(full_name=config.ADMIN_NAME, email=config.ADMIN_EMAIL.lower(),
                            password_hash=password_hash))
    await db.commit()
