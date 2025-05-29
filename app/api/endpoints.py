from fastapi import APIRouter, UploadFile, File as FastAPIFile, Form, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse as FastAPIFileResponse
from app.schemas import FileResponse
from app.TgCloud.client import upload_file_to_tgcloud, download_file_from_tgcloud
from app.TgCloud.files_db import SessionLocal
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def remove_file(path: str):
    if os.path.exists(path):
        os.remove(path)

@router.post("/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    folder: str = Form("default"),
    db: Session = Depends(get_db)
):
    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    db_file = await upload_file_to_tgcloud(file_location, folder=folder, db_session=db)
    return db_file

@router.get("/files/download/{filename}")
async def download_file(
    filename: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    result = await download_file_from_tgcloud(filename, db_session=db)
    if not result:
        raise HTTPException(status_code=404, detail="File not found")

    download_path, original_name = result

    background_tasks.add_task(remove_file, download_path)

    return FastAPIFileResponse(
        path=download_path,
        filename=original_name,
        media_type="application/octet-stream"
    )

