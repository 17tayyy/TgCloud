import os
from pathlib import Path
from dotenv import load_dotenv

config_path = Path(__file__).parent.parent.parent.parent / "config" / "app.env"
if config_path.exists():
    load_dotenv(config_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME = "TgCloudAPI"
    API_V1_STR = "/api/v1"
    
    # Environment
    DEV = os.getenv("NODE_ENV", "development") != "production"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Telegram Configuration
    TG_API_ID = int(os.getenv("API_ID")) if os.getenv("API_ID") else None
    TG_API_HASH = os.getenv("API_HASH")
    TG_CHAT_ID = int(os.getenv("CHAT_ID")) if os.getenv("CHAT_ID") else None
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecurepassword")
    
    # Network
    HOST = os.getenv("HOST", "localhost")
    API_PORT = int(os.getenv("API_PORT", 8000))
    FRONTEND_URL = os.getenv("FRONTEND_URL") or f"http://{os.getenv('HOST', 'localhost')}:{os.getenv('WEB_PORT', 80)}"
    
    # File Configuration
    MAX_FILE_SIZE = os.getenv("MAX_FILE_SIZE", "100MB")
    DB_PATH = os.getenv("DB_PATH", "/app/data")
    
    # Session Configuration  
    SESSION_EXPIRE_HOURS = int(os.getenv("SESSION_EXPIRE_HOURS", 24))
    SHARE_TOKEN_EXPIRE_MINUTES = int(os.getenv("SHARE_TOKEN_EXPIRE_MINUTES", 60))
    
    # CORS Origins
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        f"http://{HOST}",
        f"http://{HOST}:{API_PORT}",
        f"http://{HOST}:{os.getenv('WEB_PORT', 80)}",
        "*",
    ]

settings = Settings()