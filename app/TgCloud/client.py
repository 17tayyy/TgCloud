import os
from telethon.tl.types import DocumentAttributeFilename
from .files_db import SessionLocal, File
from datetime import datetime
import re
from app.core.config import settings

from telethon import TelegramClient

telegram_client = TelegramClient("tgcloud_session", settings.TG_API_ID, settings.TG_API_HASH)
telegram_client.start()
chat_id = settings.TG_CHAT_ID

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloaded_files")

async def upload_file_to_tgcloud(file_path, folder="default", db_session=None):
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
        
    message = await telegram_client.send_file(
        chat_id,
        file=file_path,
        caption=filename,
        attributes=[DocumentAttributeFilename(filename)],
        part_size_kb=2048
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

    if os.path.exists(file_path):
        os.remove(file_path)

    if close_db:
        db_session.close()

    return db_file

async def download_file_from_tgcloud(filename, folder="default", db_session=None):
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
        part_size_kb=1024
    )

    if not os.path.exists(download_path):
        print(f"ERROR: El archivo {download_path} no se descargó correctamente")
        return None, None

    if close_db:
        db_session.close()

    return download_path, db_file.original_name
