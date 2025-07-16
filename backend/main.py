from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.endpoints import router as api_router
from app.core.config import settings
from app.client.files_db import init_db as init_tg_db
from app.client.client import telegram_client
from app.exceptions import exception_handlers

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_tg_db()
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for exc, handler in exception_handlers:
    app.add_exception_handler(exc, handler)

app.include_router(api_router, prefix=settings.API_V1_STR)