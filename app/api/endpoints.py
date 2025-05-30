from fastapi import APIRouter, UploadFile, File as FastAPIFile, Form, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse as FastAPIFileResponse
from app.schemas import FileResponse, FolderCreate
from app.TgCloud.client import upload_file_to_tgcloud, download_file_from_tgcloud, delete_file_from_tgcloud
from app.TgCloud.files_db import SessionLocal, File, Folder
from app.dependencies.db import get_db
from app.services.file_service import get_file_by_filename, get_file_by_id, get_all_files, get_files_in_folder, get_folder_by_name
from app.exceptions import FileNotFoundException, FileUploadException, FolderAlreadyExistsException, BadNameException, FolderNotFound
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
    files = get_all_files(db)
    return files

@router.get("/files/{filename}", response_model=FileResponse)
async def list_file(filename: str, db: Session = Depends(get_db)):
    if INVALID_CHARS.search(filename):
        raise BadNameException(filename)

    file = get_file_by_filename(db, filename)

    if not file:
        raise FileNotFoundException(filename)
    return file

@router.delete("/files/{filename}")
async def remove_file(filename: str, foldername: str ="default", db: Session = Depends(get_db)):
    if INVALID_CHARS.search(filename):
        raise BadNameException(filename)
    
    deleted = await delete_file_from_tgcloud(filename, folder=foldername, db_session=db)
    if not deleted:
        raise FileNotFoundException(filename)
    return {"message": f"File '{filename}' deleted from folder '{foldername}'"}

@router.get("/files/folder/{foldername}", response_model=List[FileResponse])
async def list_folder(foldername: str, db: Session = Depends(get_db)):
    if INVALID_CHARS.search(foldername):
        raise BadNameException(foldername)
    
    files_in_folder = get_files_in_folder(db, foldername)
    return files_in_folder

@router.post("/files/folder/create")
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

    return {"message": f"Folder '{create_folder}' created"}

@router.post("/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    foldername: str = Form("default"),
    db: Session = Depends(get_db)
):
    if not foldername == "default":
        folder_exists = get_folder_by_name(db, foldername)
        if not folder_exists:
            raise FolderNotFound(foldername)

    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    db_file = await upload_file_to_tgcloud(file_location, folder=foldername, db_session=db)
    if not db_file:
        raise FileUploadException("Could not save file to the cloud")
    return db_file

@router.get("/files/download/{filename}")
async def download_file(
    filename: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if INVALID_CHARS.search(filename):
        raise BadNameException(filename)
    
    result = await download_file_from_tgcloud(filename, db_session=db)
    if not result:
        raise FileNotFoundException(filename)
    
    download_path, original_name = result

    background_tasks.add_task(remove_file_from_disk, download_path)

    return FastAPIFileResponse(
        path=download_path,
        filename=original_name,
        media_type="application/octet-stream"
    )