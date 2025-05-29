# TgCloudAPI

**TgCloudAPI** is a FastAPI-based API that allows you to upload files to Telegram and manage them as if it were a cloud storage system, using Telegram channels or chats as the storage backend.

## Features

- Upload files to Telegram using the Telethon API.
- Manage files by virtual folders.
- Database to store metadata of uploaded files.
- REST endpoints to interact with the system.
- Easy configuration via environment variables.

## Project Structure

```
app/
├── TgCloud/
│   ├── client.py         # Logic for uploading/downloading files to/from Telegram and registering in the database
│   ├── files_db.py       # Database models and connection
│   └── __init__.py
├── api/
│   ├── endpoints.py      # Main API endpoints
│   └── __init__.py
├── core/
│   ├── config.py         # App configuration (API keys, chat ID, etc)
│   └── __init__.py
├── services/
│   └── file_service.py   # Business logic for files
├── schemas.py            # Pydantic schemas for validation and serialization
├── __init__.py
main.py                   # FastAPI application entry point
tests/
└── test_api.py           # Basic unit tests
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/17tayyy/TgCloudAPI.git
   cd TgCloudAPI
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root with the following content:
   ```
   TG_API_ID=your_api_id
   TG_API_HASH=your_api_hash
   TG_CHAT_ID=-your_chat_id
   PROJECT_NAME=TgCloudAPI
   API_V1_STR=/api/v1
   ```

4. **Start the application:**
   ```bash
   uvicorn main:app --reload
   ```

## Usage

- Access the interactive documentation at [http://localhost:8000/docs](http://localhost:8000/docs)
- Use the endpoints to upload and manage files.

## Main Endpoints

- `POST /api/v1/files/upload` — Upload a file to Telegram and register it in the database.
- `GET /api/v1/files/download/{filename}` — Download a file from Telegram by name.
- (Coming soon) `GET /api/v1/files/` — List uploaded files.
- (Coming soon) `GET /api/v1/files/{file_id}` — Get information about a specific file.

## Requirements

- Python 3.8+
- A Telegram account and a channel/chat to use as storage
- Telegram API ID and Hash (https://my.telegram.org)

## Tests

Run the tests with:
```bash
pytest
```

## License

MIT

---

**Note:** This project is under development and its structure and endpoints may change in the future.