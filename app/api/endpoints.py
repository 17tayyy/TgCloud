from fastapi import APIRouter, UploadFile, File as FastAPIFile, Form, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse as FastAPIFileResponse
from app.schemas import FileResponse, FolderCreate, FolderResponse
from app.TgCloud.client import upload_file_to_tgcloud, download_file_from_tgcloud, delete_file_from_tgcloud, delete_folder_from_tgcloud
from app.TgCloud.files_db import SessionLocal, File, Folder
from app.dependencies.db import get_db
from app.services.file_service import (
    get_file_by_filename,
    get_all_files,
    get_files_in_folder,
    get_folder_by_name,
    get_all_folders,
    get_file_by_id
)
from app.exceptions import (
    FileNotFoundException,
    FileUploadException,
    FolderAlreadyExistsException,
    BadNameException,
    FolderNotFound,
    FolderNotDeleted,
)
from typing import List
import shutil
import re
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
INVALID_CHARS = re.compile(r'[\\/:"*?<>|]')
os.makedirs(UPLOAD_DIR, exist_ok=True)

def remove_file_from_disk(path: str):
    if os.path.exists(path):
        os.remove(path)

@router.get("/files/", response_model=List[FileResponse])
async def list_files(db: Session = Depends(get_db)):
    return get_all_files(db)

@router.get("/folders/{folder}/files/", response_model=List[FileResponse])
async def list_files_in_folder(folder: str, db: Session = Depends(get_db)):
    if INVALID_CHARS.search(folder):
        raise BadNameException(folder)
    return get_files_in_folder(db, folder)

@router.get("/folders/{folder}/files/{filename}", response_model=FileResponse)
async def get_file_info(folder: str, filename: str, db: Session = Depends(get_db)):
    if INVALID_CHARS.search(folder) or INVALID_CHARS.search(filename):
        raise BadNameException(filename)
    file = get_file_by_filename(db, filename, folder)
    if not file:
        raise FileNotFoundException(filename)
    return file

@router.post("/folders/{folder}/files/", response_model=FileResponse)
async def upload_file(
    folder: str,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db)
):
    if INVALID_CHARS.search(folder):
        raise BadNameException(folder)
    folder_exists = get_folder_by_name(db, folder)
    if not folder_exists:
        raise FolderNotFound(folder)
    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    db_file = await upload_file_to_tgcloud(file_location, folder=folder, db_session=db)
    if not db_file:
        raise FileUploadException("Could not save file to the cloud")
    return db_file

@router.get("/folders/{folder}/files/{filename}/download")
async def download_file(
    folder: str,
    filename: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if INVALID_CHARS.search(folder) or INVALID_CHARS.search(filename):
        raise BadNameException(filename)
    result = await download_file_from_tgcloud(filename, folder, db_session=db)
    if not result or not result[0]:
        raise FileNotFoundException(filename)
    download_path, original_name = result
    background_tasks.add_task(remove_file_from_disk, download_path)
    return FastAPIFileResponse(
        path=download_path,
        filename=original_name,
        media_type="application/octet-stream"
    )

@router.delete("/folders/{folder}/files/{filename}")
async def delete_file(
    folder: str,
    filename: str,
    db: Session = Depends(get_db)
):
    if INVALID_CHARS.search(folder) or INVALID_CHARS.search(filename):
        raise BadNameException(filename)
    deleted = await delete_file_from_tgcloud(filename, folder=folder, db_session=db)
    if not deleted:
        raise FileNotFoundException(filename)
    return {"message": f"File '{filename}' deleted from folder '{folder}'"}

@router.post("/folders/")
async def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db)
):
    if INVALID_CHARS.search(folder_data.folder):
        raise BadNameException(folder_data.folder)
    exists = get_folder_by_name(db, folder_data.folder)
    if exists:
        raise FolderAlreadyExistsException(folder_data.folder)
    new_folder = Folder(name=folder_data.folder)
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return {"message": f"Folder '{folder_data.folder}' created"}

@router.get("/folders/", response_model=List[FolderResponse])
async def list_folder(db: Session = Depends(get_db)):
    return get_all_folders(db)

@router.delete("/folders/{folder}/")
async def delete_folder(folder: str, db: Session = Depends(get_db)):
    if INVALID_CHARS.search(folder):
        raise BadNameException(folder)
    
    folder = get_folder_by_name(db, folder)

    if not folder:
        raise FolderNotFound(folder)
    
    deleted = await delete_folder_from_tgcloud(folder.name, db)

    if not deleted:
        raise FolderNotDeleted(folder.name)

    db.delete(folder)
    db.commit()

    return {"message": f"Folder '{folder.name}' deleted"}