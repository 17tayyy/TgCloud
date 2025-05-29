from sqlalchemy.orm import Session
from app.TgCloud.files_db import File

def get_file_by_id(db: Session, file_id: int):
    return db.query(File).filter_by(id=file_id).first()

def get_file_by_filename(db: Session, filename: str):
    return db.query(File).filter_by(filename=filename).first()