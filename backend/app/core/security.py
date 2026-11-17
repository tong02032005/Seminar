"""Băm mật khẩu và tạo/kiểm tra JWT."""
import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta, timezone

import jwt

from app.core import config
from app.core.exceptions import AuthError

_ITERATIONS = 600_000  # số vòng PBKDF2 (khuyến nghị OWASP cho SHA-256)


def hash_password(password: str) -> str:
    """Băm mật khẩu bằng PBKDF2-SHA256 (thư viện chuẩn) với salt ngẫu nhiên."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """So khớp mật khẩu với hash đã lưu; hash sai định dạng -> False."""
    try:
        _, iterations, salt, digest = password_hash.split("$")
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations))
    except ValueError:
        return False
    return hmac.compare_digest(check.hex(), digest)  # so sánh thời gian hằng, chống timing attack


def create_access_token(admin_id: int) -> str:
    """JWT chứa id admin (sub), thời điểm cấp chính xác tới micro giây (ts) và hạn dùng (exp, 8 giờ).

    ts dùng để từ chối token cấp trước lần đổi mật khẩu gần nhất (iat chuẩn chỉ chính xác tới giây).
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(admin_id), "ts": time.time(), "exp": expire}
    return jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)


def decode_access_token(token: str) -> tuple[int, float]:
    """Giải mã JWT, trả (id admin, thời điểm cấp). Sai chữ ký / hết hạn / sai định dạng -> AuthError (401)."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        return int(payload["sub"]), float(payload["ts"])
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        raise AuthError("Token không hợp lệ hoặc đã hết hạn")
