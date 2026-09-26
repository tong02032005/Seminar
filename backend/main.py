"""
ZooGuide API – backend FastAPI cho frontend React (thư mục src/).

- Dữ liệu lưu cục bộ trong file JSON (mặc định backend/data/db.json).
  Lần chạy đầu tiên file này được tạo từ backend/seed.json; xóa db.json để khôi phục dữ liệu mẫu.
- JSON trả về dùng camelCase để khớp trực tiếp với component frontend.
- Xác thực bằng JWT (Authorization: Bearer <token>), mật khẩu băm PBKDF2-SHA256.

Chạy:  uvicorn main:app --reload --port 8000   (trong thư mục backend/)
Tài liệu API: http://localhost:8000/docs
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import threading
import unicodedata
from contextlib import contextmanager
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Annotated, Literal

import jwt
from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

# ============================ CẤU HÌNH ============================

BASE_DIR = Path(__file__).resolve().parent
SEED_FILE = BASE_DIR / "seed.json"
DATA_FILE = Path(os.getenv("ZOOGUIDE_DATA_FILE", BASE_DIR / "data" / "db.json"))
SECRET_KEY = os.getenv("ZOOGUIDE_SECRET_KEY", "zooguide-dev-secret-key-change-me-in-production")
TOKEN_EXPIRE_MINUTES = int(os.getenv("ZOOGUIDE_TOKEN_EXPIRE_MINUTES", "1440"))
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("ZOOGUIDE_CORS_ORIGINS", "http://localhost:5173,http://localhost:4173").split(",")
    if o.strip()
]
# Khi chạy local, chấp nhận mọi cổng localhost (Vite tự đổi sang 5174… nếu 5173 bận)
CORS_ORIGIN_REGEX = os.getenv("ZOOGUIDE_CORS_ORIGIN_REGEX", r"http://(localhost|127\.0\.0\.1)(:\d+)?")

CategoryId = Literal["mammals", "birds", "reptiles", "amphibians", "aquatic"]
ConservationCode = Literal["LC", "NT", "VU", "EN", "CR"]
Role = Literal["admin", "staff", "visitor"]
UserStatus = Literal["active", "locked"]
ReviewStatus = Literal["pending", "approved", "hidden"]

# ============================ MẬT KHẨU & JWT ============================

PBKDF2_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations)).hex()
    return hmac.compare_digest(candidate, digest)


def create_token(user: dict) -> str:
    payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "exp": datetime.now(UTC) + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


# ============================ LƯU TRỮ (JSON FILE) ============================


class JsonStore:
    """Kho dữ liệu dạng file JSON, đủ dùng cho chạy local / demo đồ án.

    Mọi thao tác ghi đi qua `transaction()` để giữ khóa và ghi file nguyên tử.
    """

    def __init__(self, path: Path, seed_path: Path):
        self.path = path
        self.seed_path = seed_path
        self.lock = threading.RLock()
        self.data: dict = {}
        self.load()

    def load(self) -> None:
        with self.lock:
            if self.path.exists():
                self.data = json.loads(self.path.read_text(encoding="utf-8"))
            else:
                self.data = self._from_seed()
                self._write()

    def reset(self) -> None:
        """Khôi phục dữ liệu mẫu (dùng trong test)."""
        with self.lock:
            self.data = self._from_seed()
            self._write()

    def _from_seed(self) -> dict:
        data = json.loads(self.seed_path.read_text(encoding="utf-8"))
        # Seed chứa mật khẩu dạng thô để dễ đọc – băm trước khi lưu
        for user in data["users"]:
            user["passwordHash"] = hash_password(user.pop("password"))
        return data

    def _write(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, self.path)

    @contextmanager
    def transaction(self):
        with self.lock:
            yield self.data
            self._write()


store = JsonStore(DATA_FILE, SEED_FILE)


def get_db() -> dict:
    return store.data


# ============================ HÀM TIỆN ÍCH ============================


def normalize(text: str = "") -> str:
    """Bỏ dấu tiếng Việt để tìm kiếm: 'Hổ Bengal' -> 'ho bengal'."""
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn").replace("đ", "d")


def next_id(items: list[dict]) -> int:
    return max((int(i["id"]) for i in items), default=0) + 1


def today() -> str:
    return date.today().isoformat()


def not_found(message: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, message)


def bad_request(message: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, message)


def find_animal(db: dict, animal_id: int) -> dict:
    animal = next((a for a in db["animals"] if a["id"] == animal_id), None)
    if not animal:
        raise not_found("Không tìm thấy động vật này.")
    return animal


def find_zone(db: dict, zone_id: str) -> dict:
    zone = next((z for z in db["zones"] if z["id"] == zone_id), None)
    if not zone:
        raise not_found("Không tìm thấy khu vực này.")
    return zone


def animal_out(db: dict, animal: dict) -> dict:
    """Thêm zoneName để card hiển thị tên khu mà không phải tải thêm danh sách khu."""
    zone = next((z for z in db["zones"] if z["id"] == animal["zone"]), None)
    public = {k: v for k, v in animal.items() if k != "aliases"}
    return {**public, "zoneName": zone["shortName"] if zone else animal["zone"]}


def user_out(user: dict) -> dict:
    return {k: v for k, v in user.items() if k != "passwordHash"}


def review_out(db: dict, review: dict) -> dict:
    animal = next((a for a in db["animals"] if a["id"] == review["animalId"]), None)
    return {**review, "animalName": animal["name"] if animal else "—"}


# ============================ SCHEMA (camelCase) ============================


class CamelModel(BaseModel):
    """Nhận JSON camelCase từ frontend, dùng snake_case trong Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, str_strip_whitespace=True)

    def dump(self, **kwargs) -> dict:
        return self.model_dump(by_alias=True, **kwargs)


class AnimalIn(CamelModel):
    name: str = Field(min_length=1)
    scientific_name: str = Field(min_length=1)
    category: CategoryId = "mammals"
    zone: str = Field(min_length=1)
    description: str = Field(min_length=20)
    emoji: str = "🐾"
    featured: bool = False
    habitat: str = ""
    diet: str = ""
    lifespan: str = ""
    size: str = ""
    distribution: str = ""
    conservation_status: ConservationCode = "LC"
    features: list[str] = []
    fun_facts: list[str] = []
    image: str = ""
    qr_code: str | None = None

    @field_validator("qr_code")
    @classmethod
    def upper_qr(cls, v: str | None) -> str | None:
        return v.upper() if v else None


class ZoneIn(CamelModel):
    id: str = Field(pattern=r"^[a-z0-9-]{2,}$")
    name: str = Field(min_length=1)
    short_name: str = ""
    emoji: str = "🌿"
    color: str = "#4E8B5F"
    description: str = ""
    open_hours: str = "7:30 – 17:30"
    area: str = ""
    image: str = ""


class LoginIn(CamelModel):
    email: str
    password: str


class RegisterIn(CamelModel):
    full_name: str = Field(min_length=2)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=6)


class ProfileIn(CamelModel):
    full_name: str = Field(min_length=2)


class UserPatch(CamelModel):
    role: Role | None = None
    status: UserStatus | None = None


class ReviewIn(CamelModel):
    animal_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10)


class ReviewPatch(CamelModel):
    status: ReviewStatus


class SettingsIn(CamelModel):
    zoo_name: str = Field(min_length=1)
    open_hours: str = ""
    hotline: str = ""
    auto_approve: bool = False
    default_lang: Literal["vi", "en"] = "vi"


class ChatIn(CamelModel):
    message: str = Field(min_length=1, max_length=500)
    history: list[dict] = []


# ============================ XÁC THỰC ============================

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[dict, Depends(get_db)],
) -> dict:
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bạn cần đăng nhập.")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError as err:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.") from err
    user = next((u for u in db["users"] if str(u["id"]) == payload.get("sub")), None)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tài khoản không còn tồn tại.")
    if user["status"] == "locked":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản đã bị khóa. Liên hệ quản trị viên.")
    return user


def get_optional_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[dict, Depends(get_db)],
) -> dict | None:
    if not creds:
        return None
    try:
        return get_current_user(creds, db)
    except HTTPException:
        return None


def require_admin(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Chỉ quản trị viên mới có quyền này.")
    return user


DB = Annotated[dict, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
OptionalUser = Annotated[dict | None, Depends(get_optional_user)]
Admin = Annotated[dict, Depends(require_admin)]

# ============================ APP ============================

app = FastAPI(
    title="ZooGuide API",
    version="1.0.0",
    description="Backend cho hệ thống thuyết minh thông minh trong sở thú",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["system"])
def health():
    return {"status": "ok", "time": datetime.now(UTC).isoformat()}


# ---------------------------- ANIMALS ----------------------------

SORTERS = {
    "popular": (lambda a: -a["popularity"], False),
    "name-asc": (lambda a: normalize(a["name"]), False),
    "name-desc": (lambda a: normalize(a["name"]), True),
}


@app.get("/api/animals", tags=["animals"])
def list_animals(
    db: DB,
    search: str = "",
    category: str = "",
    zone: str = "",
    sort: Literal["popular", "name-asc", "name-desc"] = "popular",
    featured: bool = False,
):
    result = db["animals"]
    if search:
        q = normalize(search)
        result = [a for a in result if q in normalize(a["name"]) or q in normalize(a["scientificName"])]
    if category:
        result = [a for a in result if a["category"] == category]
    if zone:
        result = [a for a in result if a["zone"] == zone]
    if featured:
        result = [a for a in result if a["featured"]]
    key, reverse = SORTERS[sort]
    return [animal_out(db, a) for a in sorted(result, key=key, reverse=reverse)]


@app.get("/api/animals/qr/{code}", tags=["animals"])
def get_animal_by_qr(code: str, db: DB):
    clean = code.strip().upper()
    animal = next((a for a in db["animals"] if a["qrCode"] == clean or str(a["id"]) == clean), None)
    if not animal:
        raise not_found(f'Mã "{clean}" không khớp với động vật nào.')
    return animal_out(db, animal)


@app.get("/api/animals/{animal_id}", tags=["animals"])
def get_animal(animal_id: int, db: DB):
    return animal_out(db, find_animal(db, animal_id))


@app.get("/api/animals/{animal_id}/related", tags=["animals"])
def related_animals(animal_id: int, db: DB, limit: int = Query(4, ge=1, le=20)):
    current = find_animal(db, animal_id)
    related = [
        a for a in db["animals"]
        if a["id"] != current["id"] and (a["zone"] == current["zone"] or a["category"] == current["category"])
    ]
    return [animal_out(db, a) for a in related[:limit]]


def _check_animal_refs(db: dict, data: dict, exclude_id: int | None = None) -> None:
    find_zone(db, data["zone"])
    if data.get("qrCode") and any(a["qrCode"] == data["qrCode"] and a["id"] != exclude_id for a in db["animals"]):
        raise bad_request(f'Mã QR "{data["qrCode"]}" đã được dùng cho động vật khác.')


@app.post("/api/animals", tags=["animals"], status_code=status.HTTP_201_CREATED)
def create_animal(body: AnimalIn, _: Admin):
    with store.transaction() as db:
        data = body.dump()
        _check_animal_refs(db, data)
        new_id = next_id(db["animals"])
        animal = {**data, "id": new_id, "popularity": 50, "aliases": [],
                  "qrCode": data["qrCode"] or f"ZOO-{new_id:03d}"}
        db["animals"].append(animal)
        return animal_out(db, animal)


@app.put("/api/animals/{animal_id}", tags=["animals"])
def update_animal(animal_id: int, body: AnimalIn, _: Admin):
    with store.transaction() as db:
        animal = find_animal(db, animal_id)
        data = body.dump(exclude_unset=True)
        _check_animal_refs(db, {**animal, **data}, exclude_id=animal_id)
        if not data.get("qrCode"):
            data.pop("qrCode", None)
        animal.update(data)
        return animal_out(db, animal)


@app.delete("/api/animals/{animal_id}", tags=["animals"], status_code=status.HTTP_204_NO_CONTENT)
def delete_animal(animal_id: int, _: Admin):
    with store.transaction() as db:
        find_animal(db, animal_id)
        db["animals"] = [a for a in db["animals"] if a["id"] != animal_id]
        db["reviews"] = [r for r in db["reviews"] if r["animalId"] != animal_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------- ZONES ----------------------------


@app.get("/api/zones", tags=["zones"])
def list_zones(db: DB):
    return [{**z, "animalCount": sum(a["zone"] == z["id"] for a in db["animals"])} for z in db["zones"]]


@app.get("/api/zones/{zone_id}", tags=["zones"])
def get_zone(zone_id: str, db: DB):
    zone = find_zone(db, zone_id)
    animals = [animal_out(db, a) for a in db["animals"] if a["zone"] == zone_id]
    return {**zone, "animalCount": len(animals), "animals": animals}


@app.post("/api/zones", tags=["zones"], status_code=status.HTTP_201_CREATED)
def create_zone(body: ZoneIn, _: Admin):
    with store.transaction() as db:
        if any(z["id"] == body.id for z in db["zones"]):
            raise bad_request("Mã khu vực đã tồn tại.")
        zone = body.dump()
        zone["shortName"] = zone["shortName"] or zone["name"]
        db["zones"].append(zone)
        return zone


@app.put("/api/zones/{zone_id}", tags=["zones"])
def update_zone(zone_id: str, body: ZoneIn, _: Admin):
    with store.transaction() as db:
        zone = find_zone(db, zone_id)
        zone.update({**body.dump(exclude_unset=True), "id": zone_id})  # không cho đổi mã khu
        zone["shortName"] = zone.get("shortName") or zone["name"]
        return zone


@app.delete("/api/zones/{zone_id}", tags=["zones"], status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: str, _: Admin):
    with store.transaction() as db:
        find_zone(db, zone_id)
        if any(a["zone"] == zone_id for a in db["animals"]):
            raise bad_request("Khu vực còn động vật. Chuyển động vật sang khu khác trước khi xóa.")
        db["zones"] = [z for z in db["zones"] if z["id"] != zone_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------- TOURS & MAP ----------------------------


@app.get("/api/tours", tags=["tours"])
def list_tours(db: DB):
    return db["tours"]


@app.get("/api/map/points", tags=["map"])
def list_map_points(db: DB):
    return db["mapPoints"]


# ---------------------------- AUTH ----------------------------


def auth_response(user: dict) -> dict:
    return {"access_token": create_token(user), "token_type": "bearer", "user": user_out(user)}


@app.post("/api/auth/login", tags=["auth"])
def login(body: LoginIn, db: DB):
    user = next((u for u in db["users"] if u["email"].lower() == body.email.lower()), None)
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email hoặc mật khẩu không đúng.")
    if user["status"] == "locked":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản đã bị khóa. Liên hệ quản trị viên.")
    return auth_response(user)


@app.post("/api/auth/register", tags=["auth"], status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn):
    with store.transaction() as db:
        if any(u["email"].lower() == body.email.lower() for u in db["users"]):
            raise bad_request("Email này đã được đăng ký.")
        user = {
            "id": next_id(db["users"]), "fullName": body.full_name, "email": body.email.lower(),
            "passwordHash": hash_password(body.password), "role": "visitor", "status": "active",
            "createdAt": today(), "avatar": "",
        }
        db["users"].append(user)
        return auth_response(user)


@app.get("/api/auth/me", tags=["auth"])
def me(user: CurrentUser):
    return user_out(user)


# ---------------------------- USERS ----------------------------


@app.put("/api/users/me", tags=["users"])
def update_profile(body: ProfileIn, user: CurrentUser):
    with store.transaction():
        user["fullName"] = body.full_name
        return user_out(user)


@app.get("/api/users", tags=["users"])
def list_users(db: DB, _: Admin):
    return [user_out(u) for u in db["users"]]


@app.patch("/api/users/{user_id}", tags=["users"])
def patch_user(user_id: int, body: UserPatch, admin: Admin):
    with store.transaction() as db:
        user = next((u for u in db["users"] if u["id"] == user_id), None)
        if not user:
            raise not_found("Không tìm thấy tài khoản.")
        if user_id == admin["id"]:
            raise bad_request("Không thể tự đổi quyền hoặc khóa tài khoản của chính mình.")
        user.update(body.dump(exclude_none=True))
        return user_out(user)


@app.delete("/api/users/{user_id}", tags=["users"], status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, admin: Admin):
    with store.transaction() as db:
        if user_id == admin["id"]:
            raise bad_request("Không thể xóa tài khoản đang đăng nhập.")
        if not any(u["id"] == user_id for u in db["users"]):
            raise not_found("Không tìm thấy tài khoản.")
        db["users"] = [u for u in db["users"] if u["id"] != user_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------- REVIEWS ----------------------------


@app.get("/api/reviews", tags=["reviews"])
def list_reviews(
    db: DB,
    user: OptionalUser,
    animal_id: int | None = None,
    user_id: int | None = None,
    status_: Annotated[ReviewStatus | None, Query(alias="status")] = None,
):
    """Khách chỉ thấy đánh giá đã duyệt, trừ đánh giá của chính mình; admin thấy tất cả."""
    is_admin = bool(user and user["role"] == "admin")
    own = bool(user and user_id == user["id"])
    result = db["reviews"]
    if animal_id is not None:
        result = [r for r in result if r["animalId"] == animal_id]
    if user_id is not None:
        result = [r for r in result if r["userId"] == user_id]
    if status_:
        result = [r for r in result if r["status"] == status_]
    if not is_admin and not own:
        result = [r for r in result if r["status"] == "approved"]
    return [review_out(db, r) for r in sorted(result, key=lambda r: r["createdAt"], reverse=True)]


@app.post("/api/reviews", tags=["reviews"], status_code=status.HTTP_201_CREATED)
def create_review(body: ReviewIn, user: CurrentUser):
    with store.transaction() as db:
        find_animal(db, body.animal_id)
        auto = db["settings"].get("autoApprove") and body.rating >= 4
        review = {
            "id": next_id(db["reviews"]), "animalId": body.animal_id, "userId": user["id"],
            "userName": user["fullName"], "rating": body.rating, "comment": body.comment,
            "status": "approved" if auto else "pending", "createdAt": today(),
        }
        db["reviews"].append(review)
        return review_out(db, review)


@app.patch("/api/reviews/{review_id}", tags=["reviews"])
def patch_review(review_id: int, body: ReviewPatch, _: Admin):
    with store.transaction() as db:
        review = next((r for r in db["reviews"] if r["id"] == review_id), None)
        if not review:
            raise not_found("Không tìm thấy đánh giá.")
        review["status"] = body.status
        return review_out(db, review)


@app.delete("/api/reviews/{review_id}", tags=["reviews"], status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, _: Admin):
    with store.transaction() as db:
        if not any(r["id"] == review_id for r in db["reviews"]):
            raise not_found("Không tìm thấy đánh giá.")
        db["reviews"] = [r for r in db["reviews"] if r["id"] != review_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------- ADMIN ----------------------------


@app.get("/api/admin/stats", tags=["admin"])
def dashboard_stats(db: DB, _: Admin):
    approved = [r for r in db["reviews"] if r["status"] == "approved"]
    return {
        "animals": len(db["animals"]),
        "zones": len(db["zones"]),
        "users": len(db["users"]),
        "visits": sum(m["value"] for m in db["visitsByMonth"]),
        "reviews": len(db["reviews"]),
        "averageRating": round(sum(r["rating"] for r in approved) / len(approved), 1) if approved else 0,
        "pendingReviews": sum(r["status"] == "pending" for r in db["reviews"]),
        "visitsByMonth": db["visitsByMonth"],
        "animalsByZone": [
            {"label": z["shortName"], "value": sum(a["zone"] == z["id"] for a in db["animals"])}
            for z in db["zones"]
        ],
    }


@app.get("/api/admin/settings", tags=["admin"])
def get_settings(db: DB, _: Admin):
    return db["settings"]


@app.put("/api/admin/settings", tags=["admin"])
def update_settings(body: SettingsIn, _: Admin):
    with store.transaction() as db:
        db["settings"] = body.dump()
        return db["settings"]


# ---------------------------- CHATBOT ----------------------------


def _find_animal_in_text(db: dict, text: str) -> dict | None:
    # So khớp cả cụm từ, giữ dấu để "voi" không nhầm với "với"
    padded = " " + " ".join(text.lower().translate(str.maketrans("?!.,", "    ")).split()) + " "
    for animal in db["animals"]:
        names = [animal["name"].lower(), *animal.get("aliases", [])]
        if any(f" {n} " in padded for n in names):
            return animal
    return None


def chat_answer(db: dict, message: str) -> dict:
    q = normalize(message)
    animal = _find_animal_in_text(db, message)
    if animal:
        link = {"label": f"Xem {animal['name']}", "to": f"/animals/{animal['id']}"}
        if "an gi" in q or "thuc an" in q:
            return {"text": f"{animal['name']} chủ yếu ăn: {animal['diet'].lower()}.", "link": link}
        if "o dau" in q or "khu nao" in q or "vi tri" in q:
            zone = next((z for z in db["zones"] if z["id"] == animal["zone"]), None)
            return {
                "text": f"{animal['name']} ở {zone['name'] if zone else 'sở thú'}. Bạn mở Bản đồ để xem đường đi.",
                "link": {"label": "Mở bản đồ", "to": f"/map?focus={animal['zone']}"},
            }
        if "song bao lau" in q or "tuoi tho" in q:
            return {"text": f"Tuổi thọ của {animal['name']}: {animal['lifespan']}.", "link": link}
        return {"text": animal["description"], "link": link}

    for item in db["chat"]["answers"]:
        if any(normalize(k) in q for k in item["keywords"]):
            return {"text": item["answer"]}
    return {"text": db["chat"]["fallback"]}


@app.get("/api/chat/suggestions", tags=["chat"])
def chat_suggestions(db: DB):
    return db["chat"]["suggestions"]


@app.post("/api/chat", tags=["chat"])
def chat(body: ChatIn, db: DB):
    return chat_answer(db, body.message)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
