# TgCloud

TgCloud is a modern full-stack web application that uses Telegram as a cloud storage backend. It features a React frontend with a FastAPI backend, allowing you to upload, download, share, and manage files and folders with user authentication, optional encryption, and shareable expiring links.

---

## Features

### 🚀 **Frontend (React + TypeScript)**
- Modern, responsive UI with dark cyber theme
- File/folder management with grid and list views
- Drag & drop file uploads
- Context menus (right-click) for quick actions
- Real-time file preview
- Download functionality with browser integration
- Toast notifications with smart positioning
- Telegram authentication flow
- Mobile-friendly responsive design

### ⚙️ **Backend (FastAPI)**
- Upload/download files to/from Telegram via Telethon
- Organize files in virtual folders
- JWT-based user authentication
- Optional per-user file encryption
- Share files/folders with expirable tokens
- Audit logs and robust error handling
- Telegram session management via API
- SQLite database for metadata
- Ready for Docker and CI/CD

---

## Project Structure

```
TgCloud/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FileItem.tsx
│   │   │   ├── FilePreview.tsx
│   │   │   ├── FloatingActionButton.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── TelegramAuth.tsx
│   │   │   └── ...
│   │   ├── contexts/        # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   ├── FileContext.tsx
│   │   │   └── TelegramContext.tsx
│   │   ├── services/        # API services
│   │   │   └── api.ts
│   │   ├── types/           # TypeScript types
│   │   └── pages/           # Page components
│   ├── package.json
│   └── vite.config.ts
└── backend/                  # FastAPI backend
    ├── app/
    │   ├── TgCloud/
    │   │   ├── client.py     # Telegram client logic
    │   │   └── files_db.py   # SQLAlchemy models
    │   ├── api/
    │   │   └── endpoints.py  # API endpoints
    │   ├── core/
    │   │   └── config.py     # Settings
    │   ├── services/
    │   │   └── file_service.py
    │   ├── schemas.py
    │   ├── exceptions/
    │   ├── dependencies/
    │   └── utils/
    ├── main.py               # FastAPI app entrypoint
    ├── requirements.txt
    └── tests/
```

---

## Quickstart

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Telegram account and channel/chat to use as storage
- Telegram API ID and Hash from [my.telegram.org](https://my.telegram.org)

### 1. Clone the repository
```bash
git clone https://github.com/17tayyy/TgCloud.git
cd TgCloud
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
API_ID=your_telegram_api_id
API_HASH=your_telegram_api_hash
CHAT_ID=-100xxxxxxxxxx
SECRET_KEY=your_jwt_secret
PROJECT_NAME=TgCloud
API_V1_STR=/api/v1
```

Run the backend:
```bash
uvicorn main:app --reload
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the application
- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Usage

### 🌐 **Web Interface**
1. **Register/Login:** Create an account or login with existing credentials
2. **Telegram Auth:** Connect your Telegram account (phone verification + optional 2FA)
3. **File Management:** 
   - Create folders
   - Upload files (drag & drop or right-click menu)
   - Download files
   - View file previews
   - Share files with expirable links
4. **Settings:** Toggle encryption on/off

### 📱 **Mobile Support**
- Responsive design works on mobile devices
- Touch-friendly interface
- Context menus work with touch & hold

---

## Development

### Frontend Development
```bash
cd frontend
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
```

### Backend Development
```bash
cd backend
uvicorn main:app --reload  # Development server with hot reload
pytest tests/tests.py      # Run tests
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router
- React Query (TanStack Query)
- Context API for state management

**Backend:**
- FastAPI
- SQLAlchemy + SQLite
- Telethon (Telegram client)
- JWT authentication
- Pydantic schemas
- BCrypt password hashing

---

## API Reference

The backend provides a comprehensive REST API. Here are the main endpoints:

### Authentication
- `POST /api/v1/register` - Register new user
- `POST /api/v1/token` - Get JWT token

### Telegram Session
- `POST /api/v1/tgcloud/auth/phone` - Send verification code
- `POST /api/v1/tgcloud/auth/verify_code` - Verify code
- `POST /api/v1/tgcloud/auth/password` - 2FA password
- `GET /api/v1/tgcloud/auth/status` - Session status

### Files & Folders
- `GET /api/v1/folders/` - List folders
- `POST /api/v1/folders/` - Create folder
- `DELETE /api/v1/folders/{name}` - Delete folder
- `GET /api/v1/folders/{name}/files/` - List files in folder
- `POST /api/v1/folders/{name}/files/` - Upload file
- `GET /api/v1/folders/{name}/files/{filename}/download` - Download file
- `DELETE /api/v1/folders/{name}/files/{filename}` - Delete file

### Encryption & Sharing
- `POST /api/v1/encryption/on` - Enable encryption
- `POST /api/v1/encryption/off` - Disable encryption
- `POST /api/v1/folders/{name}/files/{filename}/share` - Share file
- `POST /api/v1/folders/{name}/share` - Share folder

For complete API documentation, visit the [interactive docs](http://localhost:8000/docs) when running the backend.

---

## Screenshots

### Login Page
![Login](docs/login.png)
*Beautifoul Login & register Page*

### Main Dashboard
![Dashboard](docs/dashboard.png)
*Modern file management interface with list/grid views*

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Development Notes

**Note:** This project is under active development. Features and structure may evolve as we continue improving the platform.

**About the Development:** I'm a backend specialist with expertise in APIs, databases, and server-side architecture. The frontend React application was developed with significant assistance from AI tools to ensure modern UI/UX standards and best practices. While I focus on the robust FastAPI backend and Telegram integration, the frontend leverages AI-assisted development for optimal user experience.

**Contributions Welcome:** Frontend developers are especially welcome to contribute improvements to the React codebase, UI/UX enhancements, and mobile optimization! 