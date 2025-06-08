import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "TgCloudAPI"
    API_V1_STR = "/api/v1"
    TG_API_ID = int(os.getenv("API_ID"))
    TG_API_HASH = os.getenv("API_HASH")
    TG_CHAT_ID = int(os.getenv("CHAT_ID"))
    SECRET_KEY = os.getenv("SECRET_KEY")

settings = Settings()