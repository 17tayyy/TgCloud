from fastapi import APIRouter, UploadFile, File as FastAPIFile, Form, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse as FastAPIFileResponse
from app.schemas import FileResponse, FolderCreate, FolderResponse, FileRename, FolderRename, MoveFile
from app.TgCloud.client import upload_file_to_tgcloud, download_file_from_tgcloud, delete_file_from_tgcloud, delete_folder_from_tgcloud
from app.TgCloud.files_db import SessionLocal, File, Folder
from app.dependencies.db import get_db
from app.services.file_service import (
    get_file_by_filename,
    get_all_files,
    get_files_in_folder,
    get_folder_by_name,
    get_all_folders,
    get_file_by_id,
    rename_folder_of_files,
    validate_names,
)
from app.exceptions import (
    FileNotFoundException,
    FileUploadException,
    FolderAlreadyExistsException,
    BadNameException,
    FolderNotFoundException,
    FolderNotDeletedException,
    FileAlreadyExistsException,
)
from typing import List
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def remove_file_from_disk(path: str):
    if os.path.exists(path):
        os.remove(path)

@router.get("/files/", response_model=List[FileResponse])
async def list_files(db: Session = Depends(get_db)):
    return get_all_files(db)

@router.get("/folders/{foldername}/files/", response_model=List[FileResponse])
async def list_files_in_folder(foldername: str, db: Session = Depends(get_db)):
    validate_names(foldername)
    
    return get_files_in_folder(db, foldername)

@router.get("/folders/{foldername}/files/{filename}", response_model=FileResponse)
async def get_file_info(foldername: str, filename: str, db: Session = Depends(get_db)):

    validate_names(foldername, filename)

    file = get_file_by_filename(db, filename, foldername)

    if not file:
        raise FileNotFoundException(filename)
    
    return file

@router.post("/folders/{foldername}/files/", response_model=FileResponse)
async def upload_file(
    foldername: str,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db)
):
    validate_names(foldername)

    folder_exists = get_folder_by_name(db, foldername)

    if not folder_exists:
        raise FolderNotFoundException(foldername)
    
    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_file = await upload_file_to_tgcloud(file_location, folder=foldername, db_session=db)

    if not db_file:
        raise FileUploadException("Could not save file to TgCloud")
    return db_file

@router.get("/folders/{foldername}/files/{filename}/download")
async def download_file(
    foldername: str,
    filename: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    validate_names(foldername, filename)
    
    result = await download_file_from_tgcloud(filename, foldername, db)

    if not result or not result[0]:
        raise FileNotFoundException(filename)
    
    download_path, original_name = result
    background_tasks.add_task(remove_file_from_disk, download_path)

    return FastAPIFileResponse(
        path=download_path,
        filename=original_name,
        media_type="application/octet-stream"
    )

@router.delete("/folders/{foldername}/files/{filename}")
async def delete_file(
    foldername: str,
    filename: str,
    db: Session = Depends(get_db)
):
    validate_names(foldername, filename)

    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise FolderNotFoundException(foldername)

    deleted = await delete_file_from_tgcloud(filename, foldername, db)

    if not deleted:
        raise FileNotFoundException(filename)
    
    return {"message": f"File '{filename}' deleted from folder '{foldername}'"}

@router.post("/folders/")
async def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db)
):
    validate_names(folder_data.folder)

    folder = get_folder_by_name(db, folder_data.folder)

    if folder:
        raise FolderAlreadyExistsException(folder_data.folder)
    
    new_folder = Folder(name=folder_data.folder)

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    return {"message": f"Folder '{folder_data.folder}' created"}

@router.get("/folders/", response_model=List[FolderResponse])
async def list_folders(db: Session = Depends(get_db)):
    return get_all_folders(db)

@router.delete("/folders/{foldername}/")
async def delete_folder(foldername: str, db: Session = Depends(get_db)):
    validate_names(foldername)
    
    folder = get_folder_by_name(db, foldername)

    if not folder:
        raise FolderNotFoundException(foldername)
    
    if folder.message_ids:

        deleted = await delete_folder_from_tgcloud(folder.name, db)

        if not deleted:
            raise FolderNotDeletedException(foldername)
        

    db.delete(folder)
    db.commit()

    return {"message": f"Folder '{folder.name}' deleted"}

@router.put("/folders/{foldername}/files/{filename}/rename")
async def rename_file(
    foldername: str,
    filename: str,
    data: FileRename,
    db: Session = Depends(get_db)
):
    validate_names(foldername, filename, data.new_name)

    file = get_file_by_filename(db, filename, foldername)
    
    if not file:
        raise FileNotFoundException(filename)

    existing = get_file_by_filename(db, data.new_name, foldername)
    if existing:
        raise FileAlreadyExistsException(filename, foldername)

    file.filename = data.new_name

    db.commit()
    db.refresh(file)

    return {"message": f"File '{filename}' renamed to '{data.new_name}' in folder '{foldername}'"}

@router.put("/folders/{foldername}/rename")
async def rename_folder(
    foldername: str,
    data: FolderRename,
    db: Session = Depends(get_db)
):
    validate_names(foldername, data.new_name)

    folder = get_folder_by_name(db, foldername)

    if not folder:
        raise FolderNotFoundException(foldername)
    
    existing = get_folder_by_name(db, data.new_name)

    if existing:
        raise FolderAlreadyExistsException(data.new_name)
    
    folder.name = data.new_name
    
    rename_folder_of_files(foldername, data.new_name, db)

    db.commit()
    db.refresh(folder)

    return {"message": f"Folder '{foldername}' renamed to '{data.new_name}'"}

@router.post("/folders/{foldername}/files/{filename}/move")
async def move_file(
    foldername: str,
    filename: str,
    data: MoveFile,
    db: Session = Depends(get_db)
):
    validate_names(foldername, filename, data.dest_folder)
    
    dest_folder = get_folder_by_name(db, data.dest_folder)
    if not dest_folder:
        raise FolderNotFoundException(data.dest_folder)
    
    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise FolderNotFoundException(foldername)

    file = get_file_by_filename(db, filename, foldername)
    if not file:
        raise FileNotFoundException(filename)

    file.folder = data.dest_folder

    folder.file_count = (folder.file_count or 1) - 1
    dest_folder.file_count = (dest_folder.file_count or 0) + 1

    if folder.message_ids:
        ids = [mid for mid in folder.message_ids.split(",") if mid and mid != str(file.message_id)]
        folder.message_ids = ",".join(ids)

    if dest_folder.message_ids:
        ids_dest = [mid for mid in dest_folder.message_ids.split(",") if mid]
        if str(file.message_id) not in ids_dest:
            ids_dest.append(str(file.message_id))
        dest_folder.message_ids = ",".join(ids_dest)
    else:
        dest_folder.message_ids = str(file.message_id)

    db.commit()
    db.refresh(file)
    db.refresh(folder)
    db.refresh(dest_folder)

    return {"message": f"File '{filename}' moved from '{foldername}' to '{data.dest_folder}'"}


