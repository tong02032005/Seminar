"""Tầng service – gọi dịch vụ ngoài không cần key (PRD 6.6):
- Google Translate (endpoint công khai, dự phòng bằng deep-translator) để dịch lời thuyết minh
- edge-tts (giọng Microsoft) để đọc lời thuyết minh thành file mp3; edge-tts lỗi thì dùng gTTS
  (giọng Google Translate) làm dự phòng

Hai dịch vụ này không chính thức, có thể lỗi bất cứ lúc nào: lỗi được poi_service đổi thành 503.
Test thay hai hàm này bằng hàm giả (monkeypatch) nên không cần Internet khi chạy pytest.
"""
import json
import logging
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import edge_tts
from deep_translator import GoogleTranslator
from gtts import gTTS
from fastapi.concurrency import run_in_threadpool

from app.core import config

logger = logging.getLogger("uvicorn.error")


_GTX_URL = "https://translate.googleapis.com/translate_a/single"


def _translate_gtx(text: str, source: str, target: str) -> str:
    """Gọi endpoint dịch công khai của Google (client=gtx, không cần key). Gửi POST để lời dài không vượt
    giới hạn độ dài URL. Kết quả dạng [[["câu đã dịch", "câu gốc", ...], ...], ...]."""
    query = urlencode({"client": "gtx", "sl": source, "tl": target, "dt": "t"})
    request = Request(f"{_GTX_URL}?{query}", data=urlencode({"q": text}).encode(),
                      headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded"})
    with urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))
    result = "".join(part[0] for part in data[0] if part and part[0])
    if not result.strip():
        raise RuntimeError("Google trả về bản dịch rỗng")
    return result


def _translate_sync(text: str, source: str, target: str) -> str:
    src = config.TRANSLATE_CODES.get(source, source)
    tgt = config.TRANSLATE_CODES.get(target, target)
    try:
        return _translate_gtx(text, src, tgt)
    except Exception as exc:  # endpoint chính lỗi / bị giới hạn -> thử deep-translator
        logger.warning("Dịch qua translate.googleapis.com lỗi (%r), thử deep-translator", exc)
    return GoogleTranslator(source=src, target=tgt).translate(text)


async def translate(text: str, source: str, target: str) -> str:
    """Dịch text từ ngôn ngữ source sang target (mã vi/en/zh). Gọi HTTP đồng bộ nên chạy trong threadpool
    để không chặn event loop."""
    return await run_in_threadpool(_translate_sync, text, source, target)


async def synthesize(text: str, lang: str, path: Path) -> None:
    """Đọc text bằng giọng của ngôn ngữ lang rồi ghi file mp3 vào path (edge-tts là thư viện async)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        await edge_tts.Communicate(text, config.TTS_VOICES.get(lang, config.TTS_VOICES["en"])).save(str(path))
        if path.exists() and path.stat().st_size > 0:
            return
        raise RuntimeError("edge-tts trả về file rỗng")
    except Exception as exc:
        logger.warning("edge-tts lỗi (%r), chuyển sang gTTS", exc)
    # Dự phòng: gTTS là thư viện đồng bộ nên chạy trong threadpool
    tts = gTTS(text, lang=config.TRANSLATE_CODES.get(lang, lang))
    await run_in_threadpool(tts.save, str(path))
