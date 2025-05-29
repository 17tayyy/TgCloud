import os
import tempfile
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/api/v1/")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello from FastAPI!"}

def test_upload_file():
    # Crea un archivo temporal para subir
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"Hello, test file!")
        tmp_filename = tmp.name

    with open(tmp_filename, "rb") as f:
        response = client.post(
            "/api/v1/files/upload",
            files={"file": ("test.txt", f, "text/plain")}
        )
    os.remove(tmp_filename)
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["size"] == 17
    assert "uploaded_at" in data