from sqlalchemy.orm import Session
from app.TgCloud.files_db import File, Folder
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

def validate_names(*names):
    for name in names:
        if INVALID_CHARS.search(name):
            raise BadNameException(name)