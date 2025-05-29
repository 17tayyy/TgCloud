from fastapi import APIRouter, UploadFile, File, HTTPException
from app.TgCloud.client import upload_file_to_tgcloud
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    db_file = await upload_file_to_tgcloud(file_location)
    return {"msg": "File saved and processing started", "file_id": db_file.id}
