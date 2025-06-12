# TgCloudAPI

TgCloudAPI is a FastAPI-based REST API that lets you use Telegram as a cloud storage backend. You can upload, download, share, and manage files and folders, with user authentication, optional encryption, and shareable expiring links.

---

## Features

- Upload/download files to/from Telegram via Telethon.
- Organize files in virtual folders.
- JWT-based user authentication.
- Optional per-user file encryption.
- Share files/folders with expirable tokens.
- Audit logs and robust error handling.
- Telegram session management via API.
- SQLite database for metadata.
- Ready for Docker and CI/CD.

---

## Project Structure

```
app/
├── TgCloud/
│   ├── client.py         # Telegram client logic (upload/download/delete)
│   ├── files_db.py       # SQLAlchemy models and DB setup
├── api/
│   └── endpoints.py      # All API endpoints
├── core/
│   └── config.py         # Settings and environment variables
├── services/
│   └── file_service.py   # File/folder business logic
├── schemas.py            # Pydantic schemas
├── exceptions/           # Custom exceptions and handlers
├── dependencies/         # FastAPI dependencies
├── utils/                # Utilities (encryption, etc)
main.py                   # FastAPI app entrypoint
tests/
│   └── tests.py          # Pytest-based API tests
```

---

## Quickstart

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/17tayyy/TgCloudAPI.git
   cd TgCloudAPI
   pip install -r requirements.txt
   ```

2. **Configure environment variables**  
   Create a `.env` file in the root:
   ```
   API_ID=your_telegram_api_id
   API_HASH=your_telegram_api_hash
   CHAT_ID=-100xxxxxxxxxx
   SECRET_KEY=your_jwt_secret
   PROJECT_NAME=TgCloudAPI
   API_V1_STR=/api/v1
   ```

3. **Run the API**
   ```bash
   uvicorn main:app --reload
   ```

4. **Open the docs**  
   Visit [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

### User Authentication

- `POST /api/v1/register`  
  Register a new user.  
  **Body:** `{ "username": "user", "password": "pass" }`

- `POST /api/v1/token`  
  Get JWT token.  
  **Form:** `username`, `password`

---

### Telegram Session Authentication

- `POST /api/v1/tgcloud/auth/phone`  
  Send Telegram code to phone.  
  **Body:** `{ "phone": "+34XXXXXXXXX" }`

- `POST /api/v1/tgcloud/auth/verify_code`  
  Verify code sent to Telegram.  
  **Body:** `{ "phone": "+34XXXXXXXXX", "code": "12345" }`  
  Returns `"Password required"` if 2FA is enabled.

- `POST /api/v1/tgcloud/auth/password`  
  Complete login with 2FA password.  
  **Body:** `{ "password": "your_telegram_password" }`

- `GET /api/v1/tgcloud/auth/status`  
  Check Telegram session status.

---

### Folders

- `POST /api/v1/folders/`  
  Create a new folder.  
  **Body:** `{ "folder": "myfolder" }`

- `GET /api/v1/folders/`  
  List all folders.

- `PUT /api/v1/folders/{foldername}/rename`  
  Rename a folder.  
  **Body:** `{ "new_name": "newfolder" }`

- `DELETE /api/v1/folders/{foldername}/`  
  Delete a folder.

---

### Files

- `POST /api/v1/folders/{foldername}/files/`  
  Upload a file to a folder.  
  **Form:** `file` (UploadFile)

- `GET /api/v1/folders/{foldername}/files/`  
  List files in a folder.

- `GET /api/v1/folders/{foldername}/files/{filename}`  
  Get file info.

- `GET /api/v1/folders/{foldername}/files/{filename}/download`  
  Download a file.

- `PUT /api/v1/folders/{foldername}/files/{filename}/rename`  
  Rename a file.  
  **Body:** `{ "new_name": "newfile.txt" }`

- `POST /api/v1/folders/{foldername}/files/{filename}/move`  
  Move a file to another folder.  
  **Body:** `{ "dest_folder": "otherfolder" }`

- `DELETE /api/v1/folders/{foldername}/files/{filename}`  
  Delete a file.

---

### Encryption

- `POST /api/v1/encryption/on`  
  Enable encryption for current user.

- `POST /api/v1/encryption/off`  
  Disable encryption for current user.

---

### Sharing

- `POST /api/v1/folders/{foldername}/files/{filename}/share`  
  Generate a share token for a file.

- `POST /api/v1/folders/{foldername}/share`  
  Generate a share token for a folder.

- `POST /api/v1/access/revoke/{token}`  
  Revoke a share token.

- `GET /api/v1/access/file/{token}`  
  Get shared file info.

- `GET /api/v1/access/file/{token}/download`  
  Download shared file.

- `GET /api/v1/access/folder/{token}`  
  Get shared folder info.

- `GET /api/v1/access/folder/{token}/{filename}/download`  
  Download file from shared folder.

---

### Stats

- `GET /api/v1/stats/`  
  Get usage statistics for the current user.

---

## Example Usage (curl)

```bash
# Register a user
curl -X POST http://localhost:8000/api/v1/register -H "Content-Type: application/json" -d '{"username":"user","password":"pass"}'

# Login and get token
curl -X POST http://localhost:8000/api/v1/token -F "username=user" -F "password=pass"

# Authenticate Telegram session
curl -X POST http://localhost:8000/api/v1/tgcloud/auth/phone -H "Content-Type: application/json" -d '{"phone":"+34XXXXXXXXX"}'
curl -X POST http://localhost:8000/api/v1/tgcloud/auth/verify_code -H "Content-Type: application/json" -d '{"phone":"+34XXXXXXXXX","code":"12345"}'
curl -X POST http://localhost:8000/api/v1/tgcloud/auth/password -H "Content-Type: application/json" -d '{"password":"your_telegram_password"}'

# Upload a file
curl -X POST http://localhost:8000/api/v1/folders/myfolder/files/ -H "Authorization: Bearer <token>" -F "file=@/path/to/file.txt"
```

---

## Running Tests

You can test the API endpoints using pytest:

```bash
pytest tests/tests.py
```

---

## Requirements

- Python 3.8+
- Telegram account and channel/chat to use as storage
- Telegram API ID and Hash (https://my.telegram.org)
- SQLite (default) or adapt for another DB

---

## License

MIT

---

**Note:** This project is under active development and its structure and endpoints may change in the future.