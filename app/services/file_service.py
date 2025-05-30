from sqlalchemy.orm import Session
from app.TgCloud.files_db import File, Folder

def get_file_by_id(db: Session, file_id: int):
    return db.query(File).filter_by(id=file_id).first()

def get_file_by_filename(db: Session, filename: str):
    return db.query(File).filter_by(filename=filename).first()

def get_all_files(db: Session):
    return db.query(File).all()

def get_files_in_folder(db: Session, foldername: str):
    return db.query(File).filter_by(folder=foldername).all()

def get_folder_by_name(db: Session, foldername: str):
    return db.query(Folder).filter_by(name=foldername).first()