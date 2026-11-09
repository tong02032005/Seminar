"""Điểm vào của backend ZooGuide: tạo app FastAPI, bật CORS, đổi lỗi nghiệp vụ thành HTTP, gắn các router."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core import config
from app.core.database import engine, init_db
from app.core.exceptions import AppError
from app.routers import animals, auth, categories, health, pois, systems, zone


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Chạy một lần khi khởi động: thêm dữ liệu mặc định còn thiếu (bảng do Alembic tạo trước).
    Khi tắt app: đóng hết kết nối CSDL."""
    await init_db()  # await: chờ seed dữ liệu mặc định xuống SQLite
    yield
    await engine.dispose()  # await: chờ đóng các kết nối trong pool


app = FastAPI(title="ZooGuide API (Seminar)", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    """Đổi exception nghiệp vụ từ service thành HTTP response {"detail": "..."} với mã lỗi tương ứng."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


for module in (health, auth, animals, zone, pois, categories, systems):
    app.include_router(module.router)

# Phục vụ file tĩnh: ảnh app/static/uploads/... và mp3 ĐÃ LƯU app/static/audio/... -> URL /static/...
# (file nháp nằm ở app/audio_drafts, ngoài static, nên khách không mở được)
config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)  # StaticFiles báo lỗi nếu thư mục chưa có
config.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=config.STATIC_DIR), name="static")
