from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileBase(BaseModel):
    folder: str
    filename: str
    size: str
    encrypted: bool
    original_name: str

class FolderCreate(BaseModel):
    folder: str

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