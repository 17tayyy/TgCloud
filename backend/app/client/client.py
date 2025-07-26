import os
from pathlib import Path
from telethon.tl.types import DocumentAttributeFilename
from .files_db import SessionLocal, File, Folder, User
from datetime import datetime
import re
from app.core.config import settings
from sqlalchemy.orm import Session
from app.core.errors import ExternalServiceError
from telethon import TelegramClient
from app.utils.encryption import encrypt_file, decrypt_file

# Use configurable paths
BASE_DIR = Path(__file__).parent.parent.parent
SESSION_DIR = Path(settings.DB_PATH) if hasattr(settings, 'DB_PATH') and settings.DB_PATH else BASE_DIR
SESSION_FILE = SESSION_DIR / "tgcloud_session.session"
DOWNLOADS_DIR = BASE_DIR / "downloaded_files"

# Ensure directories exist
SESSION_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

telegram_client = TelegramClient(str(SESSION_FILE.with_suffix('')), settings.TG_API_ID, settings.TG_API_HASH)
chat_id = settings.TG_CHAT_ID


async def ensure_telegram_ready():
    if not telegram_client.is_connected():
        await telegram_client.connect()

    if not SESSION_FILE.exists():
        raise ExternalServiceError("Telegram", "Not authorized")
    
    if not await telegram_client.is_user_authorized():
        raise ExternalServiceError("Telegram", "Not authorized")
    
async def upload_file_to_tgcloud(file_path: str, folder: str = "default", db_session: Session = None, username: str = None, progress_callback=None):
    close_db = False
    if db_session is None:
        db_session = SessionLocal()
        close_db = True

    user = db_session.query(User).filter_by(username=username).first()
    encryption_enabled = user.encryption_enabled if user else False

    filename = os.path.basename(file_path)
    encrypted = False
    if encryption_enabled:
        encrypted_file_path = encrypt_file(file_path)
        file_path = encrypted_file_path
        filename = os.path.basename(encrypted_file_path)
        encrypted = True

    existing_files = db_session.query(File).filter_by(folder=folder).all()
    base_filename = filename
    max_num = 0
    pattern = re.compile(r"^\((\d+)\)\.(.+)$")
    for file in existing_files:
        match = pattern.match(file.filename)
        if file.filename == base_filename:
            max_num = max(max_num, 1)
        elif match and match.group(2) == base_filename:
            num = int(match.group(1))
            max_num = max(max_num, num + 1)
    if max_num > 0:
        filename = f"({max_num}).{base_filename}"

    if not telegram_client.is_connected():
        await telegram_client.connect()

    uploaded_file = await telegram_client.upload_file(
        file_path,
        part_size_kb=512,
        progress_callback=progress_callback
    )

    message = await telegram_client.send_file(
        chat_id,
        file=uploaded_file,
        caption=filename,
        attributes=[DocumentAttributeFilename(filename)],
        force_document=True
    )

    uploaded_at = message.date if hasattr(message, "date") and message.date else datetime.now()

    db_file = File(
        folder=folder,
        filename=filename,
        message_id=message.id,
        size=str(os.path.getsize(file_path)),
        encrypted=encrypted,
        original_name=os.path.basename(file_path) if not encrypted else os.path.basename(file_path).replace("encrypted_", "", 1),
        uploaded_at=uploaded_at
    )
    db_session.add(db_file)
    db_session.commit()
    db_session.refresh(db_file)

    folder = db_session.query(Folder).filter_by(name=folder).first()

    if folder:
        if folder.message_ids:
            folder.message_ids += f",{message.id}"
        else:
            folder.message_ids = str(message.id)
        
        if folder.file_count is None:
            folder.file_count = 1
        else:
            folder.file_count += 1
        
        db_session.commit()

    if os.path.exists(file_path):
        os.remove(file_path)

    if close_db:
        db_session.close()

    return db_file

async def download_file_from_tgcloud(filename: str, folder: str ="default", db_session: Session = None, progress_callback=None):
    close_db = False

    if db_session is None:
        db_session = SessionLocal()
        close_db = True

    db_file = db_session.query(File).filter_by(filename=filename, folder=folder).first()
    if not db_file:
        if close_db:
            db_session.close()
        return None

    message = await telegram_client.get_messages(chat_id, ids=db_file.message_id)
    if not message or not message.document:
        if close_db:
            db_session.close()
        return None, None

    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    download_path = DOWNLOADS_DIR / db_file.filename
    
    await telegram_client.download_file(
        message.document,
        file=str(download_path),
        part_size_kb=1024*2,
        progress_callback=progress_callback
    )

    if db_file.encrypted:
        decrypt_file(download_path)

    if not os.path.exists(download_path):
        return None, None

    if close_db:
        db_session.close()

    return download_path, db_file.original_name

async def delete_file_from_tgcloud(filename: str, folder: str = "default", db_session: Session = None):
    close_db = False
    if db_session is None:
        db_session = SessionLocal()
        close_db = True

    db_file = db_session.query(File).filter_by(filename=filename, folder=folder).first()
    if not db_file:
        if close_db:
            db_session.close()
        return False

    await telegram_client.delete_messages(chat_id, db_file.message_id)

    db_session.delete(db_file)
    db_session.commit()

    if close_db:
        db_session.close()

    return True

async def delete_folder_from_tgcloud(folder: str, db_session: Session = None):
    close_db = False
    if db_session is None:
        db_session = SessionLocal()
        close_db = True

    folder_obj = db_session.query(Folder).filter_by(name=folder).first()
    if not folder_obj or not folder_obj.message_ids:
        if close_db:
            db_session.close()
        return False

    message_ids_parsed = [mid for mid in folder_obj.message_ids.split(",") if mid]
    for message_id in message_ids_parsed:
        await telegram_client.delete_messages(chat_id, int(message_id))

    db_session.query(File).filter_by(folder=folder).delete()
    db_session.commit()

    if close_db:
        db_session.close()

    return True