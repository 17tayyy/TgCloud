from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class FileBase(BaseModel):
    folder: str
    filename: str
    size: str
    encrypted: bool
    original_name: str

class FolderCreate(BaseModel):
    folder: str

class FileRename(BaseModel):
    new_name: str

class FolderRename(BaseModel):
    new_name: str

class MoveFile(BaseModel):
    dest_folder: str

class FileCreate(FileBase):
    pass

class FolderResponse(BaseModel):
    id: int
    name: str
    file_count: Optional[int] = 0
    message_ids: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class FileResponse(FileBase):
    id: int
    message_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str

class MessageResponse(BaseModel):
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class StatsResponse(BaseModel):
    total_space_used: str
    total_files: int
    total_folders: int
    space_used_for_folder: Dict[str, int]
    encryption_enabled: bool

class PhoneRequest(BaseModel):
    phone: str

class CodeRequest(BaseModel):
    phone: str
    code: str

class PasswordRequest(BaseModel):
    password: str

class SharedFolderResponse(BaseModel):
    foldername: str
    files: list[FileResponse]
    created_at: datetime