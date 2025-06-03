import pytest
import httpx
import os

API_URL = "http://127.0.0.1:8000/api/v1"
TEST_FILE_PATH = "/home/tay/Desktop/Projects/TelegramCloudSystem/TgCloudCLI/downloads/test.txt"

@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=API_URL) as c:
        yield c

def test_create_folder(client):
    resp = client.post("/folders/", json={"folder": "testfolder"})
    assert resp.status_code == 200
    assert resp.json()["message"] == "Folder 'testfolder' created"

def test_upload_file(client):
    assert os.path.exists(TEST_FILE_PATH), "Test file does not exist"
    with open(TEST_FILE_PATH, "rb") as f:
        files = {"file": ("test.txt", f, "text/plain")}
        resp = client.post("/folders/testfolder/files/", files=files)
    assert resp.status_code == 200
    assert resp.json()["filename"] == "test.txt"

def test_list_files_in_folder(client):
    resp = client.get("/folders/testfolder/files/")
    assert resp.status_code == 200
    filenames = [f["filename"] for f in resp.json()]
    assert "test.txt" in filenames

def test_get_file_info(client):
    resp = client.get("/folders/testfolder/files/test.txt")
    assert resp.status_code == 200
    assert resp.json()["filename"] == "test.txt"

def test_download_file(client, tmp_path):
    resp = client.get("/folders/testfolder/files/test.txt/download")
    assert resp.status_code == 200
    download_path = tmp_path / "downloaded_test.txt"
    with open(download_path, "wb") as f:
        f.write(resp.content)
    with open(TEST_FILE_PATH, "rb") as orig:
        assert orig.read() == download_path.read_bytes()

def test_rename_file(client):
    resp = client.put(
        "/folders/testfolder/files/test.txt/rename",
        json={"new_name": "renamed.txt"}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "File 'test.txt' renamed to 'renamed.txt' in folder 'testfolder'"

def test_renamed_file_in_folder(client):
    resp = client.get("/folders/testfolder/files/")
    assert resp.status_code == 200
    filenames = [f["filename"] for f in resp.json()]
    assert "renamed.txt" in filenames

def test_rename_folder(client):
    resp = client.put(
        "/folders/testfolder/rename",
        json={"new_name": "renamedfolder"}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Folder 'testfolder' renamed to 'renamedfolder'"

def test_renamed_file_in_renamed_folder(client):
    resp = client.get("/folders/renamedfolder/files/")
    assert resp.status_code == 200
    filenames = [f["filename"] for f in resp.json()]
    assert "renamed.txt" in filenames

def test_create_movedfolder(client):
    resp = client.post("/folders/", json={"folder": "movedfolder"})
    assert resp.status_code == 200 or (
        resp.status_code == 400 and "already exists" in resp.text
    )

def test_move_file(client):
    resp = client.post(
        "/folders/renamedfolder/files/renamed.txt/move",
        json={"dest_folder": "movedfolder"}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "File 'renamed.txt' moved from 'renamedfolder' to 'movedfolder'"

def test_file_in_movedfolder(client):
    resp = client.get("/folders/movedfolder/files/")
    assert resp.status_code == 200
    filenames = [f["filename"] for f in resp.json()]
    assert "renamed.txt" in filenames

def test_delete_file_from_movedfolder(client):
    resp = client.delete("/folders/movedfolder/files/renamed.txt")
    assert resp.status_code == 200
    assert resp.json()["message"] == "File 'renamed.txt' deleted from folder 'movedfolder'"

def test_delete_movedfolder(client):
    resp = client.delete("/folders/movedfolder/")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Folder 'movedfolder' deleted"

def test_delete_renamedfolder(client):
    resp = client.delete("/folders/renamedfolder/")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Folder 'renamedfolder' deleted"
