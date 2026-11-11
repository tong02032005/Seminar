"""Tầng service – UC09 Xem thống kê (đếm trực tiếp từ CSDL) và thống kê người dùng (khách truy cập)."""
import re
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.poi import Poi, PoiContent
from app.models.zone import Zone
from app.models.animal import Animal
from app.repositories import lookup_repository, stats_repository


async def get_dashboard(db: AsyncSession) -> dict:
    """UC09 bước 2 – tổng động vật (đang hiện, đang ẩn), số khu, số POI, số động vật chưa có POI và theo từng
    ngôn ngữ: số POI thiếu lời thuyết minh, số POI chưa có file âm thanh. CSDL trống thì mọi số là 0."""
    total = await stats_repository.count_all(db, Animal)
    visible = await stats_repository.count_visible_animals(db)
    pois = await stats_repository.count_all(db, Poi)
    by_language = []
    for language in await lookup_repository.list_languages(db):
        with_narration = await stats_repository.count_pois_with(db, language.code, PoiContent.narration)
        with_audio = await stats_repository.count_pois_with(db, language.code, PoiContent.audio_file)
        by_language.append({"lang": language.code, "pois_missing_narration": pois - with_narration,
                            "pois_missing_audio": pois - with_audio})
    return {
        "total_animals": total, "visible_animals": visible, "hidden_animals": total - visible,
        "total_zones": await stats_repository.count_all(db, Zone), "total_pois": pois,
        "animals_without_poi": await stats_repository.count_animals_without_poi(db),
        "by_language": by_language,
    }


# ----- THỐNG KÊ NGƯỜI DÙNG (khách truy cập) -----

ONLINE_SECONDS = 15  # khách gửi tín hiệu mỗi 5 giây; quá 15 giây không thấy thì coi như đã rời trang
VN_OFFSET = timedelta(hours=7)  # ponytail: múi giờ cố định UTC+7, thêm vào cài đặt nếu sở thú ở nơi khác

# ponytail: lưu trong RAM (mã khách -> lần cuối thấy), khởi động lại backend thì về 0 rồi tăng lại sau vài giây;
# chạy nhiều tiến trình uvicorn thì phải chuyển sang CSDL / Redis
_last_seen: dict[str, float] = {}


def _online_count() -> int:
    cutoff = time.monotonic() - ONLINE_SECONDS
    for visitor_id in [v for v, seen in _last_seen.items() if seen < cutoff]:
        del _last_seen[visitor_id]
    return len(_last_seen)


async def record_visit(db: AsyncSession, visitor_id: str, path: str | None) -> None:
    """Khách báo đang mở trang. Có path = vừa mở trang mới -> ghi một lượt xem; không có = tín hiệu "vẫn đang xem"."""
    _last_seen[visitor_id] = time.monotonic()
    _online_count()  # dọn khách đã rời để dict không phình ra
    if path:
        stats_repository.add_page_view(db, path, visitor_id)
        await db.commit()


ANIMAL_PATH = re.compile(r"/animals/(\d+)")
PAGE_TITLES = {"/": "Trang chủ", "/animals": "Danh sách động vật", "/zones": "Khu vực", "/map": "Bản đồ"}


def _page_title(path: str, names: dict[int, str]) -> str | None:
    match = ANIMAL_PATH.fullmatch(path)
    return names.get(int(match[1])) if match else PAGE_TITLES.get(path)


async def get_visitor_stats(db: AsyncSession, days: int = 7) -> dict:
    """Đang online, hôm nay, tổng; lượt xem từng ngày trong `days` ngày gần nhất (giờ VN) và 10 trang xem nhiều nhất."""
    local_now = datetime.now(timezone.utc).replace(tzinfo=None) + VN_OFFSET
    today = local_now.date()
    today_start_utc = datetime.combine(today, datetime.min.time()) - VN_OFFSET
    first_day = today - timedelta(days=days - 1)

    rows = await stats_repository.daily_views(db, today_start_utc - timedelta(days=days - 1), "+7 hours")
    by_day = {day: (views, visitors) for day, views, visitors in rows}
    daily = []
    for i in range(days):
        day = (first_day + timedelta(days=i)).isoformat()
        views, visitors = by_day.get(day, (0, 0))
        daily.append({"date": day, "views": views, "visitors": visitors})

    pages = await stats_repository.top_pages(db, 10)
    ids = [int(m[1]) for path, _ in pages if (m := ANIMAL_PATH.fullmatch(path))]
    names = await stats_repository.animal_names(db, ids, "vi") if ids else {}

    today_views, today_visitors = await stats_repository.count_views(db, today_start_utc)
    total_views, total_visitors = await stats_repository.count_views(db)
    return {
        "online_now": _online_count(),
        "today_views": today_views, "today_visitors": today_visitors,
        "total_views": total_views, "total_visitors": total_visitors,
        "daily": daily,
        "top_pages": [{"path": path, "title": _page_title(path, names), "views": views} for path, views in pages],
    }
