from fastapi import FastAPI
from app.api.endpoints import router as api_router
from app.core.config import settings
from app.TgCloud.files_db import init_db as init_tg_db
from app.TgCloud.client import telegram_client

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    init_tg_db()
    await telegram_client.start()
    
app.include_router(api_router, prefix=settings.API_V1_STR)