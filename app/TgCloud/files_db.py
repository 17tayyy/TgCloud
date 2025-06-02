from sqlalchemy import Column, Integer, String, Boolean, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./tg_files.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    folder = Column(String, index=True)
    filename = Column(String, index=True)
    message_id = Column(Integer)
    size = Column(String)
    encrypted = Column(Boolean)
    original_name = Column(String)
    uploaded_at = Column(DateTime, default=datetime.now())

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    file_count = Column(Integer)
    message_ids = Column(String)
    created_at = Column(DateTime, default=datetime.now())

def init_db():
    Base.metadata.create_all(bind=engine)