from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileBase(BaseModel):
    folder: str
    filename: str
    size: str
    encrypted: bool
    original_name: str

class FileCreate(FileBase):
    pass

class FileResponse(FileBase):
    id: int
    message_id: int
    uploaded_at: datetime

    class Config:
        orm_mode = True