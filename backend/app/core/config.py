import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "TgCloudAPI"
    API_V1_STR = "/api/v1"
    DEV = True
    TG_API_ID = int(os.getenv("API_ID")) if os.getenv("API_ID") else None
    TG_API_HASH = os.getenv("API_HASH")
    TG_CHAT_ID = int(os.getenv("CHAT_ID")) if os.getenv("CHAT_ID") else None
    SECRET_KEY = os.getenv("SECRET_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
    
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "*",
    ]

settings = Settings()