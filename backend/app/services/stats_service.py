"""Tầng service – UC09 Xem thống kê. Chỉ đọc; số liệu đếm trực tiếp từ CSDL."""
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
