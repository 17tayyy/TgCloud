from sqlalchemy.orm import Session
from sqlalchemy import func
from app.TgCloud.files_db import File, Folder, User
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

def validate_names(*names):
    for name in names:
        if INVALID_CHARS.search(name):
            raise BadNameException(name)