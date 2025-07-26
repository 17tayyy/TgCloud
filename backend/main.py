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
from app.core.errors import exception_handlers
from app.core.logging import logger, setup_logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured logging
    setup_logging()
    logger.info("Starting TgCloud application", extra_fields={"version": "1.0.0"})
    
    # Initialize database
    init_tg_db()
    logger.info("Database initialized successfully")
    
    yield
    
    logger.info("Shutting down TgCloud application")

if settings.DEV:
    app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
else:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )

# Global error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(
            f"Unhandled error in request {request.url}", 
            extra_fields={
                "method": request.method,
                "url": str(request.url),
                "error": str(e)
            },
            exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_code": "INTERNAL_ERROR"}
        )

# CORS middleware
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

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "service": "TgCloud Backend",
        "version": "1.0.0",
        "timestamp": "2025-07-26T00:00:00Z"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router)