# TgCloudAPI

**TgCloudAPI** es una API basada en FastAPI que permite subir archivos a Telegram y gestionarlos como si fuera un sistema de almacenamiento en la nube, usando canales o chats de Telegram como backend de almacenamiento.

## Características

- Subida de archivos a Telegram mediante la API de Telethon.
- Gestión de archivos por carpetas virtuales.
- Base de datos para registrar metadatos de los archivos subidos.
- Endpoints REST para interactuar con el sistema.
- Configuración sencilla mediante variables de entorno.

## Estructura del Proyecto

```
app/
├── TgCloud/
│   ├── client.py         # Lógica para subir archivos a Telegram y registrar en la base de datos
│   ├── files_db.py       # Modelos y conexión a la base de datos
│   └── __init__.py
├── api/
│   ├── endpoints.py      # Endpoints principales de la API
│   └── __init__.py
├── core/
│   ├── config.py         # Configuración de la aplicación (API keys, chat ID, etc)
│   └── __init__.py
├── __init__.py
main.py                   # Punto de entrada de la aplicación FastAPI
tests/
└── test_api.py           # Pruebas unitarias básicas
```

## Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/17tayyy/TgCloudAPI.git
   cd TgCloudAPI
   ```

2. **Instala las dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configura las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```
    API_ID=tu_api_id
    API_HASH=tu_api_hash
    CHAT_ID=-tu_chat_id
   ```

4. **Inicia la aplicación:**
   ```bash
   uvicorn main:app --reload
   ```

## Uso

- Accede a la documentación interactiva en [http://localhost:8000/docs](http://localhost:8000/docs)
- Usa los endpoints para subir y gestionar archivos.

## Endpoints principales

- `POST /upload/` — Sube un archivo a Telegram y lo registra en la base de datos.
- `GET /files/` — Lista los archivos subidos.
- `GET /files/{file_id}` — Obtiene información de un archivo específico.

## Requisitos

- Python 3.8+
- Una cuenta de Telegram y un canal/chat para usar como almacenamiento
- API ID y Hash de Telegram (https://my.telegram.org)

## Tests

Ejecuta los tests con:
```bash
pytest
```

## Licencia

MIT

---

**Nota:** Este proyecto está en desarrollo y puede cambiar su estructura y endpoints en el futuro.