import os
from telethon.tl.types import DocumentAttributeFilename
from .files_db import SessionLocal, File, Folder
from datetime import datetime
import re
from app.core.config import settings
from sqlalchemy.orm import Session
from telethon import TelegramClient

telegram_client = TelegramClient("tgcloud_session", settings.TG_API_ID, settings.TG_API_HASH)
chat_id = settings.TG_CHAT_ID

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloaded_files")

async def upload_file_to_tgcloud(file_path: str, folder: str ="default", db_session: Session = None):
    close_db = False
    if db_session is None:
        db_session = SessionLocal()
        close_db = True

    filename = os.path.basename(file_path)

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
        part_size_kb=512
    )

    message = await telegram_client.send_file(
        chat_id,
        file=uploaded_file,
        caption=filename,
        attributes=[DocumentAttributeFilename(filename)],
    )

    uploaded_at = message.date if hasattr(message, "date") and message.date else datetime.now()

    db_file = File(
        folder=folder,
        filename=filename,
        message_id=message.id,
        size=str(os.path.getsize(file_path)),
        encrypted=False,
        original_name=os.path.basename(file_path),
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

async def download_file_from_tgcloud(filename: str, folder: str ="default", db_session: Session = None):
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
        print(f"ERROR: No se encontró el documento en Telegram para {filename}")
        return None, None

    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    download_path = os.path.join(DOWNLOADS_DIR, db_file.filename)
    await telegram_client.download_file(
        message.document,
        file=download_path,
        part_size_kb=1024*2
    )

    if not os.path.exists(download_path):
        print(f"ERROR: El archivo {download_path} no se descargó correctamente")
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

