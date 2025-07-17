from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
from contextlib import asynccontextmanager
from app.api.endpoints import router as api_router
from app.api.websocket import router as websocket_router
from app.core.config import settings
from app.client.files_db import init_db as init_tg_db
from app.client.client import telegram_client
from app.exceptions import exception_handlers
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_tg_db()
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Middleware para agregar CORS headers a todas las respuestas (incluyendo errores)
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Error in request: {str(e)}")
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    
    # Agregar headers CORS a todas las respuestas
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Type, Content-Length"
    
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
)

for exc, handler in exception_handlers:
    app.add_exception_handler(exc, handler)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router)