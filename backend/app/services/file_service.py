from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.auth.jwt_auth import create_access_token, decode_access_token
from datetime import datetime, timedelta
from app.client.files_db import File, Folder, User, ShareToken
from app.exceptions import BadNameException
import re

INVALID_CHARS = re.compile(r'[\\/:"*?<>|]')

def get_file_by_id(db: Session, file_id: int):
    return db.query(File).filter_by(id=file_id).first()

def get_file_by_filename(db: Session, filename: str, foldername: str):
    return db.query(File).filter_by(folder=foldername, filename=filename).first()

def get_all_files(db: Session):
    return db.query(File).all()

def get_files_in_folder(db: Session, foldername: str):
    return db.query(File).filter_by(folder=foldername).all()

def get_folder_by_name(db: Session, foldername: str):
    return db.query(Folder).filter_by(name=foldername).first()

def get_all_folders(db: Session):
    return db.query(Folder).all()

def rename_folder_of_files(foldername: str, new_name: str, db: Session):
    db.query(File).filter_by(folder=foldername).update({"folder": new_name})

def get_total_files(db: Session):
    return db.query(func.count(File.id)).scalar()

def get_total_folders(db: Session):
    return db.query(func.count(Folder.id)).scalar()

def get_user(username: str, db: Session):
    return db.query(User).filter_by(username=username).first()

def get_used_space_in_folder(db: Session, foldername: str):
    result = db.query(Folder.message_ids).filter_by(name=foldername).first()
    if not result or not result[0]:
        return 0
    message_ids = [mid for mid in result[0].strip(",").split(",") if mid]
    if not message_ids:
        return 0
    space_used = db.query(func.sum(File.size)).filter(File.message_id.in_(message_ids)).scalar() or 0
    return space_used

def get_all_folders_used_space(db: Session):
    folders = db.query(Folder).all()
    result = {}
    for folder in folders:
        space = get_used_space_in_folder(db, folder.name)
        result[folder.name] = space
    return result

def get_used_space(db: Session):
    return db.query(func.sum(File.size)).scalar() or 0

def validate_share_token(db: Session, token: str, expected_type: str):
    db_token = db.query(ShareToken).filter_by(token=token).first()
    if not db_token or db_token.revoked:
        raise HTTPException(status_code=401, detail="Share token revoked or not found")
    
    if db_token.expires_at < datetime.now():
        raise HTTPException(status_code=401, detail="Share token expired")
    
    payload = decode_access_token(token)
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=400, detail="Invalid share token")
    
    return payload, db_token

def get_share_token(token: str, owner: str, db: Session):
    return db.query(ShareToken).filter_by(token=token, owner=owner).first()

def validate_names(*names):
    for name in names:
        if INVALID_CHARS.search(name):
            raise BadNameException(name)