from fastapi import APIRouter, UploadFile, File as FastAPIFile, Form, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse as FastAPIFileResponse, JSONResponse
from app.schemas import FileResponse, FolderCreate, FolderResponse, FileRename, FolderRename, MoveFile, UserCreate, MessageResponse, TokenResponse, StatsResponse, PasswordRequest, CodeRequest, PhoneRequest, SharedFolderResponse
from app.client.client import upload_file_to_tgcloud, download_file_from_tgcloud, delete_file_from_tgcloud, delete_folder_from_tgcloud
from app.client.files_db import SessionLocal, File, Folder, User, ShareToken
from app.core.config import settings
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError
from telethon.sessions import StringSession
from app.client.client import telegram_client, ensure_telegram_ready
from app.core.db import get_db
from app.core.files import human_readable_size
from app.services.progress_service import progress_manager
import uuid
from app.services.file_service import (
    get_file_by_filename,
    get_all_files,
    get_files_in_folder,
    get_folder_by_name,
    get_all_folders,
    get_file_by_id,
    rename_folder_of_files,
    validate_names,
    get_used_space,
    get_all_folders_used_space,
    get_total_files,
    get_total_folders,
    get_used_space_in_folder,
    get_user,
    validate_share_token,
    get_share_token,
)
from app.core.errors import (
    NotFoundError,
    ValidationError,
    ConflictError,
    AuthenticationError,
    AuthorizationError,
    ExternalServiceError,
    TgCloudError,
)
from typing import List
import shutil
from datetime import timedelta, datetime
import os
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.jwt_auth import authenticate_user, create_access_token, get_current_user, get_password_hash

router = APIRouter()
UPLOAD_DIR = "uploaded_files"
SHARE_TOKEN_EXPIRE_MINUTES = 60
os.makedirs(UPLOAD_DIR, exist_ok=True)

def remove_file_from_disk(path: str):
    if os.path.exists(path):
        os.remove(path)

@router.get("/files/", response_model=List[FileResponse])
async def list_files(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Return all fthe files from de Database"""
    
    return get_all_files(db)

@router.get("/folders/{foldername}/files/", response_model=List[FileResponse])
async def list_files_in_folder(
    foldername: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Return all the files in the specified folder"""
    
    validate_names(foldername)

    return get_files_in_folder(db, foldername)

@router.get("/folders/{foldername}/files/{filename}", response_model=FileResponse)
async def get_file_info(
    foldername: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Return information about the specified file"""

    validate_names(foldername, filename)

    file = get_file_by_filename(db, filename, foldername)

    if not file:
        raise NotFoundError("File", filename)
    
    return file

@router.get("/folders/{foldername}/files/{filename}/download")
async def download_file(
    foldername: str,
    filename: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    
    """Download the file from telegram to the server.
    When downloaded it gives the file to the user,
    to be downloaded in the browser"""

    operation_id = str(uuid.uuid4())
    
    try:        
        await ensure_telegram_ready() # Make sure that telegram session is correctly running
        validate_names(foldername, filename)

        file_db = get_file_by_filename(db, filename, foldername)
        if not file_db:
            raise NotFoundError("File", filename)

        if file_db.encrypted and not current_user.encryption_enabled:
            return {"detail": "This file is encrypted. Please enable encryption in your account to download it."}

        # Start tracking the download progress
        await progress_manager.update_progress(operation_id, current_user.username, {
            'progress': 0,
            'status': 'starting',
            'filename': filename,
            'operation': 'download',
            'speed': '0 B/s',
            'eta': 'calculating...'
        })

        async def progress_callback(current, total):
            """Update the progress of the download operation"""

            if total is None or total == 0:
                estimated_progress = min(int((current / (10 * 1024 * 1024)) * 80), 85)
                await progress_manager.update_progress(
                    operation_id, 
                    current_user.username, 
                    {
                        'progress': estimated_progress,
                        'status': 'downloading_from_telegram',
                        'filename': filename,
                        'operation': 'download',
                        'speed': f'{human_readable_size(current)} downloaded',
                        'eta': 'calculating...'
                    }
                )
            else:
                await progress_manager.update_progress(
                    operation_id, 
                    current_user.username, 
                    {
                        'progress': min(int((current / total) * 95), 95),
                        'status': 'downloading_from_telegram',
                        'filename': filename,
                        'operation': 'download',
                        'speed': f'{human_readable_size(current)}/{human_readable_size(total)}',
                        'eta': 'downloading...'
                    }
                )

        result = await download_file_from_tgcloud(filename, foldername, db, progress_callback)
        
        if not result or not result[0]:
            await progress_manager.complete_operation(operation_id, current_user.username, False)
            raise NotFoundError("File", filename)
        
        # Download completed successfully
        await progress_manager.complete_operation(operation_id, current_user.username, True)
        
        download_path, original_name = result
        
        background_tasks.add_task(remove_file_from_disk, download_path) # Remove the file from disk after serving it
        
        # Create a FastAPIFileResponse to serve the file
        response = FastAPIFileResponse(
            path=download_path,
            filename=original_name,
            media_type="application/octet-stream"
        )
        
        # Set CORS headers for the response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
        
        return response
    
    except Exception as e:
        await progress_manager.complete_operation(operation_id, current_user.username, False)
        raise e

@router.options("/folders/{foldername}/files/{filename}/download")
async def download_file_options(foldername: str, filename: str):
    """Handle CORS preflight requests for file download"""
    response = JSONResponse(content={})
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@router.post("/folders/{foldername}/files/", response_model=dict)
async def upload_file(
    foldername: str,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    
    """Upload a file to the specified folder in TgCloud."""

    operation_id = str(uuid.uuid4()) # Generate a unique operation ID for tracking progress
    
    try:

        if not telegram_client.is_connected():
            raise ExternalServiceError("Telegram", "Not authorized")

        await ensure_telegram_ready()
        validate_names(foldername)

        folder_exists = get_folder_by_name(db, foldername)
        if not folder_exists:
            raise NotFoundError("Folder", foldername)
        
        # Start tracking the upload progress
        await progress_manager.update_progress(operation_id, current_user.username, {
            'progress': 0,
            'status': 'starting',
            'filename': file.filename,
            'operation': 'upload',
            'speed': '0 B/s',
            'eta': 'calculating...'
        })
        
        safe_filename = os.path.basename(file.filename)
        file_location = os.path.join(UPLOAD_DIR, safe_filename)

        # Save the uploaded file to disk
        file_size = 0
        with open(file_location, "wb") as buffer:
            while chunk := await file.read(8192):
                buffer.write(chunk)
                file_size += len(chunk)
        
        # Update progress after saving the file
        await progress_manager.update_progress(operation_id, current_user.username, {
            'progress': 25,
            'status': 'uploading_to_telegram',
            'filename': file.filename,
            'operation': 'upload',
            'speed': 'uploading...',
            'eta': 'calculating...'
        })

        async def progress_callback(current, total):
            """Update the progress of the upload operation"""

            if total is None or total == 0:
                estimated_progress = min(25 + int((current / (10 * 1024 * 1024)) * 60), 85)
                await progress_manager.update_progress(
                    operation_id, 
                    current_user.username, 
                    {
                        'progress': estimated_progress,
                        'status': 'uploading_to_telegram',
                        'filename': file.filename,
                        'operation': 'upload',
                        'speed': f'{human_readable_size(current)} uploaded',
                        'eta': 'uploading...'
                    }
                )
            else:
                await progress_manager.update_progress(
                    operation_id, 
                    current_user.username, 
                    {
                        'progress': min(25 + int((current / total) * 70), 95),
                        'status': 'uploading_to_telegram',
                        'filename': file.filename,
                        'operation': 'upload',
                        'speed': f'{human_readable_size(current)}/{human_readable_size(total)}',
                        'eta': 'uploading...'
                    }
                )

        # Upload the file to TgCloud
        db_file = await upload_file_to_tgcloud(
            file_location,
            folder=foldername,
            db_session=db,
            username=current_user.username,
            progress_callback=progress_callback
        )

        if not db_file:
            await progress_manager.complete_operation(operation_id, current_user.username, False)
            raise TgCloudError("Could not save file to TgCloud", "FILE_UPLOAD_ERROR")
        
        # Update progress to completed
        await progress_manager.complete_operation(operation_id, current_user.username, True)
        
        # Prepare the response with file details
        file_response = {
            "id": db_file.id,
            "folder": db_file.folder,
            "filename": db_file.filename,
            "size": db_file.size,
            "encrypted": db_file.encrypted,
            "original_name": db_file.original_name,
            "message_id": db_file.message_id,
            "uploaded_at": db_file.uploaded_at
        }
        
        # Return the operation ID and file details
        return {
            "operation_id": operation_id,
            "file": file_response,
            "status": "completed"
        }
    
    except Exception as e:
        if 'file_location' in locals() and os.path.exists(file_location):
            os.remove(file_location)
        
        error_message = str(e)
        if "PhotoInvalidDimensionsError" in error_message:
            raise TgCloudError("Invalid image file. Please try a different image format or size.", "FILE_UPLOAD_ERROR")
        elif "TelegramNotAuthorized" in error_message:
            raise TgCloudError("Telegram not authorized. Please connect your Telegram account first.", "FILE_UPLOAD_ERROR")
        elif "FileTooBigError" in error_message:
            raise TgCloudError("File is too large. Maximum file size is 2GB.", "FILE_UPLOAD_ERROR")
        else:
            raise TgCloudError(f"Upload failed: {error_message}", "FILE_UPLOAD_ERROR")

@router.get("/folders/{foldername}/files/{filename}/preview")
async def preview_file(
    foldername: str,
    filename: str,
    background_tasks: BackgroundTasks,
    token: str = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Preview a file from the specified folder in TgCloud."""

    try:
        await ensure_telegram_ready()
        validate_names(foldername, filename)

        file_db = get_file_by_filename(db, filename, foldername)
        if not file_db:
            raise NotFoundError("File", filename)

        if file_db.encrypted and not current_user.encryption_enabled:
            raise TgCloudError("This file is encrypted. Please enable encryption to preview it.", "FILE_UPLOAD_ERROR")

        result = await download_file_from_tgcloud(filename, foldername, db, None)
        
        if not result or not result[0]:
            raise NotFoundError("File", filename)
        
        download_path, original_name = result
        
        import mimetypes
        mime_type, _ = mimetypes.guess_type(original_name)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        background_tasks.add_task(remove_file_from_disk, download_path)
        
        response = FastAPIFileResponse(
            path=download_path,
            filename=original_name,
            media_type=mime_type
        )
        
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Type"
        
        if mime_type.startswith(('image/', 'video/', 'audio/', 'text/', 'application/pdf')):
            response.headers["Content-Disposition"] = f'inline; filename="{original_name}"'
        else:
            response.headers["Content-Disposition"] = f'attachment; filename="{original_name}"'
        
        return response
        
    except Exception as e:
        raise TgCloudError(f"Preview failed: {str(e)}", "PREVIEW_ERROR")

@router.options("/folders/{foldername}/files/{filename}/preview")
async def preview_file_options(foldername: str, filename: str):
    response = JSONResponse(content={})
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@router.delete("/folders/{foldername}/files/{filename}", response_model=MessageResponse)
async def delete_file(
    foldername: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a file from the specified folder in TgCloud."""
    await ensure_telegram_ready()
    validate_names(foldername, filename)

    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise NotFoundError("Folder", foldername)
    
    file_db = get_file_by_filename(db, filename, foldername)
    if not file_db:
        raise NotFoundError("File", filename)

    deleted = await delete_file_from_tgcloud(filename, foldername, db)
    if not deleted:
        raise NotFoundError("File", filename)

    if folder.file_count is not None and folder.file_count > 0:
        folder.file_count -= 1
    else:
        folder.file_count = 0

    if folder.message_ids:
        ids = [mid for mid in folder.message_ids.split(",") if mid and mid != str(file_db.message_id)]
        folder.message_ids = ",".join(ids)

    db.commit()

    return {"message": f"File '{filename}' deleted from folder '{foldername}'"}

@router.post("/folders/", response_model=FolderResponse)
async def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create a new folder in TgCloud."""
    validate_names(folder_data.folder)

    folder = get_folder_by_name(db, folder_data.folder)
    if folder:
        raise ConflictError(f"Folder already exists: {folder_data.folder}", "folder")
    
    new_folder = Folder(name=folder_data.folder)

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    return new_folder

@router.get("/folders/", response_model=List[FolderResponse])
async def list_folders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Return all folders from TgCloud."""
    return get_all_folders(db)

@router.delete("/folders/{foldername}/", response_model=MessageResponse)
async def delete_folder(
    foldername: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a folder from TgCloud."""
    await ensure_telegram_ready()
    validate_names(foldername)

    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise NotFoundError("Folder", foldername)
    
    if folder.message_ids:
        deleted = await delete_folder_from_tgcloud(folder.name, db)
        if not deleted:
            raise TgCloudError(f"Could not delete folder: {foldername}", "FOLDER_DELETE_ERROR")
        
    db.delete(folder)
    db.commit()

    return {"message": f"Folder '{folder.name}' deleted"}

@router.put("/folders/{foldername}/files/{filename}/rename", response_model=MessageResponse)
async def rename_file(
    foldername: str,
    filename: str,
    data: FileRename,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Rename a file in the specified folder in TgCloud."""
    validate_names(foldername, filename, data.new_name)

    file = get_file_by_filename(db, filename, foldername)
    if not file:
        raise NotFoundError("File", filename)
    
    existing = get_file_by_filename(db, data.new_name, foldername)
    if existing:
        raise ConflictError(f"File already exists: {filename, foldername}", "file")
    
    file.filename = data.new_name

    db.commit()
    db.refresh(file)

    return {"message": f"File '{filename}' renamed to '{data.new_name}' in folder '{foldername}'"}

@router.put("/folders/{foldername}/rename", response_model=MessageResponse)
async def rename_folder(
    foldername: str,
    data: FolderRename,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Rename a folder in TgCloud."""
    validate_names(foldername, data.new_name)

    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise NotFoundError("Folder", foldername)
    
    existing = get_folder_by_name(db, data.new_name)
    if existing:
        raise ConflictError(f"Folder already exists: {data.new_name}", "folder")
    
    folder.name = data.new_name

    rename_folder_of_files(foldername, data.new_name, db)

    db.commit()
    db.refresh(folder)

    return {"message": f"Folder '{foldername}' renamed to '{data.new_name}'"}

@router.post("/folders/{foldername}/files/{filename}/move", response_model=MessageResponse)
async def move_file(
    foldername: str,
    filename: str,
    data: MoveFile,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Move a file from one folder to another in TgCloud."""

    validate_names(foldername, filename, data.dest_folder)

    dest_folder = get_folder_by_name(db, data.dest_folder)
    if not dest_folder:
        raise NotFoundError("Folder", data.dest_folder)
    
    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise NotFoundError("Folder", foldername)
    
    file = get_file_by_filename(db, filename, foldername)
    if not file:
        raise NotFoundError("File", filename)
    
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

@router.get("/stats/", response_model=StatsResponse)
async def get_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    total_space_used = human_readable_size(get_used_space(db))
    total_files = get_total_files(db)
    total_folders = get_total_folders(db)
    space_used_for_folder = get_all_folders_used_space(db)
    encryption_enabled = current_user.encryption_enabled
    return {
        "total_space_used": total_space_used,
        "total_files": total_files,
        "total_folders": total_folders,
        "space_used_for_folder": space_used_for_folder,
        "encryption_enabled": encryption_enabled,
    }

@router.post("/register", response_model=MessageResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user in TgCloud."""
    existing = get_user(user.username, db)
    if existing:
        raise ConflictError(f"Username already exists: {user.username}", "user")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": f"User '{user.username}' registered successfully"}


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise AuthenticationError("Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/encryption/on", response_model=MessageResponse)
async def enable_encryption(
    db: Session = Depends(get_db),
    current_user= Depends(get_current_user)
):
    """Enable encryption for the current user's account."""
    current_user.encryption_enabled = True
    db.commit()
    db.refresh(current_user)
    return {"message": "Encryption enabled for this account"}

@router.post("/encryption/off", response_model=MessageResponse)
async def disable_encryption(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Disable encryption for the current user's account."""
    current_user.encryption_enabled = False

    db.commit()
    db.refresh(current_user)
    return {"message": "Encryption disabled for this account"}

@router.post("/folders/{foldername}/files/{filename}/share", response_model=MessageResponse)
async def share_file(
    foldername: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Share a file from the specified folder in TgCloud."""
    validate_names(foldername, filename)

    file = get_file_by_filename(db, filename, foldername)
    if not file:
        raise NotFoundError("File", filename)
    
    expires_at = datetime.now() + timedelta(minutes=SHARE_TOKEN_EXPIRE_MINUTES)
    
    # Create a share token for the file
    token = create_access_token(
        data={
            "folder": foldername,
            "filename": filename,
            "type": "file",
            "owner": current_user.username
        },
        expires_delta=timedelta(minutes=SHARE_TOKEN_EXPIRE_MINUTES)
    )

    # Store the share token in the database
    db_token = ShareToken(
        token=token,
        type="file",
        folder=foldername,
        filename=filename,
        owner=current_user.username,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    url = f"{settings.FRONTEND_URL}/shared/file/{token}"
    return {"message": url}

@router.post("/folders/{foldername}/share", response_model=MessageResponse)
async def share_folder(
    foldername: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Share a folder from TgCloud."""
    
    validate_names(foldername)

    folder = get_folder_by_name(db, foldername)
    if not folder:
        raise NotFoundError("Folder", foldername)
    expires_at = datetime.now() + timedelta(minutes=SHARE_TOKEN_EXPIRE_MINUTES)

    token = create_access_token(
        data={
            "folder": foldername,
            "type": "folder",
            "owner": current_user.username
        },
        expires_delta=timedelta(minutes=SHARE_TOKEN_EXPIRE_MINUTES)
    )

    db_token = ShareToken(
        token=token,
        type="folder",
        folder=foldername,
        filename=None,
        owner=current_user.username,
        expires_at=expires_at
    )

    db.add(db_token)
    db.commit()

    url = f"{settings.FRONTEND_URL}/shared/folder/{token}"
    return {"message": url}

@router.get("/access/file/{token}", response_model=FileResponse)
async def access_shared_file_info(
    token: str,
    db: Session = Depends(get_db),
):
    """Access shared file information using a share token."""

    payload, db_token = validate_share_token(db, token, "file")
    folder = payload["folder"]
    filename = payload["filename"]
    file_db = get_file_by_filename(db, filename, folder)
    if not file_db:
        raise NotFoundError("File", filename)
    return file_db

@router.get("/access/file/{token}/download")
async def download_shared_file(
    token: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Download a shared file using a share token."""
    await ensure_telegram_ready()

    payload, db_token = validate_share_token(db, token, "file")
    folder = payload["folder"]
    filename = payload["filename"]
    file_db = get_file_by_filename(db, filename, folder)
    if not file_db:
        raise NotFoundError("File", filename)
    
    result = await download_file_from_tgcloud(filename, folder, db, None)
    if not result or not result[0]:
        raise NotFoundError("File", filename)
    
    download_path, original_name = result
    background_tasks.add_task(remove_file_from_disk, download_path)
    
    # Create a FastAPIFileResponse to serve the file
    response = FastAPIFileResponse(
        path=download_path,
        filename=original_name,
        media_type="application/octet-stream"
    )
    
    # Set CORS headers for the response
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    
    return response

@router.get("/access/folder/{token}", response_model=SharedFolderResponse)
async def access_shared_folder_info(
    token: str,
    db: Session = Depends(get_db)
):
    """Access shared folder information using a share token."""
    payload, db_token = validate_share_token(db, token, "folder")
    folder_name = payload["folder"]
    
    # Get folder info
    folder = get_folder_by_name(db, folder_name)
    if not folder:
        raise NotFoundError("Folder", folder_name)
    
    # Get files in folder
    files = get_files_in_folder(db, folder_name)
    
    return SharedFolderResponse(
        foldername=folder_name,
        files=files,
        created_at=folder.created_at
    )

@router.get("/access/folder/{token}/{filename}/download")
async def download_file_from_shared_folder(
    token: str,
    background_tasks: BackgroundTasks,
    filename: str,
    db: Session = Depends(get_db)
):
    """Download a file from a shared folder using a share token."""
    await ensure_telegram_ready()
    payload, db_token = validate_share_token(db, token, "folder")
    folder = payload["folder"]
    file_db = get_file_by_filename(db, filename, folder)
    if not file_db:
        raise NotFoundError("File", filename)
    
    result = await download_file_from_tgcloud(filename, folder, db, None)
    if not result or not result[0]:
        raise NotFoundError("File", filename)
    
    download_path, original_name = result
    background_tasks.add_task(remove_file_from_disk, download_path)
    
    response = FastAPIFileResponse(
        path=download_path,
        filename=original_name,
        media_type="application/octet-stream"
    )
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    
    return response

@router.post("/access/revoke/{token}", response_model=MessageResponse)
async def revoke_share_token(
    token: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Revoke a share token."""
    db_token = get_share_token(token, current_user.username, db)
    if not db_token:
        raise NotFoundError("Token", token)
    
    db_token.revoked = True
    db.commit()
    return {"message": "Share token revoked"}


@router.post("/tgcloud/auth/phone", response_model=MessageResponse)
async def tgcloud_send_phone(data: PhoneRequest):
    """Send a code to the user's phone number for Telegram authentication."""
    if not settings.TG_API_ID or not settings.TG_API_HASH:
        return {"message": "Telegram API credentials not configured"}
    
    try:
        await telegram_client.connect()
        await telegram_client.send_code_request(data.phone)
        return {"message": "Code sent"}
    except Exception as e:
        return {"message": f"Error sending code: {str(e)}"}

@router.post("/tgcloud/auth/verify_code", response_model=MessageResponse)
async def tgcloud_verify_code(data: CodeRequest):
    """Verify the code sent to the user's phone number for Telegram authentication."""
    if not settings.TG_API_ID or not settings.TG_API_HASH:
        return {"message": "Telegram API credentials not configured"}
    
    try:
        await telegram_client.connect()
        await telegram_client.sign_in(data.phone, data.code)
        return {"message": "Authenticated"}
    except SessionPasswordNeededError:
        return {"message": "Password required"}
    except PhoneCodeInvalidError:
        return {"message": "Invalid code"}
    except Exception as e:
        return {"message": f"Error verifying code: {str(e)}"}

@router.post("/tgcloud/auth/password", response_model=MessageResponse)
async def tgcloud_send_password(data: PasswordRequest):
    """Send a password for Telegram authentication."""
    if not settings.TG_API_ID or not settings.TG_API_HASH:
        return {"message": "Telegram API credentials not configured"}
    
    try:
        await telegram_client.connect()
        await telegram_client.sign_in(password=data.password)
        return {"message": "Authenticated"}
    except Exception as e:
        return {"message": f"Error verifying password: {str(e)}"}

@router.get("/tgcloud/auth/status", response_model=MessageResponse)
async def tgcloud_auth_status():
    """Check the authentication status of the Telegram client."""
    if not settings.TG_API_ID or not settings.TG_API_HASH:
        return {"message": "Telegram API credentials not configured"}
    
    try:
        await telegram_client.connect()
        if await telegram_client.is_user_authorized():
            return {"message": "Authorized"}
        else:
            return {"message": "Not authorized"}
    except Exception as e:
        return {"message": f"Error checking status: {str(e)}"}

@router.get("/tgcloud/config/check", response_model=MessageResponse)
async def check_telegram_config():
    """Check if Telegram API credentials are configured."""
    try:
        if not settings.TG_API_ID or not settings.TG_API_HASH:
            return {"message": "Telegram API credentials not configured"}
        
        return {"message": f"Telegram configured - API ID: {settings.TG_API_ID}"}
    except Exception as e:
        return {"message": f"Configuration error: {str(e)}"}