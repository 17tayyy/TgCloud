import pytest
import httpx
import os

API_URL = "http://127.0.0.1:8000/api/v1"
TEST_FILE_PATH = "/home/tay/Desktop/Projects/TelegramCloudSystem/TgCloudCLI/downloads/test.txt"
TEST_USER = {"username": "testuser", "password": "testpass123"}

shared_file_token = None
shared_folder_token = None

@pytest.fixture(scope="module")
def auth_token():
    with httpx.Client(base_url=API_URL) as c:
        r = c.post("/register", json=TEST_USER)
        assert r.status_code == 200 or "Username already registered" in r.text

        data = {
            "grant_type": "password",
            "username": TEST_USER["username"],
            "password": TEST_USER["password"],
            "scope": "",
            "client_id": "",
            "client_secret": ""
        }
        r = c.post("/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code == 200
        token = r.json()["access_token"]
        return token

@pytest.fixture(scope="module")
def client(auth_token):
    with httpx.Client(base_url=API_URL, headers={"Authorization": f"Bearer {auth_token}"}) as c:
        yield c

def test_create_folder(client):
    resp = client.post("/folders/", json={"folder": "testfolder"})
    assert resp.status_code == 200 or "already exists" in resp.text

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

def test_share_file(client):
    global shared_file_token
    resp = client.post("/folders/testfolder/files/test.txt/share")
    assert resp.status_code == 200
    assert "access/file/" in resp.json()["message"]
    url = resp.json()["message"]
    shared_file_token = url.split("/")[-1]
    assert shared_file_token

def test_access_shared_file_info():
    url = f"{API_URL}/access/file/{shared_file_token}"
    resp = httpx.get(url)
    assert resp.status_code == 200
    assert resp.json()["filename"] == "test.txt"

def test_download_shared_file(tmp_path):
    url = f"{API_URL}/access/file/{shared_file_token}/download"
    resp = httpx.get(url)
    assert resp.status_code == 200
    download_path = tmp_path / "public_downloaded_test.txt"
    with open(download_path, "wb") as f:
        f.write(resp.content)
    with open(TEST_FILE_PATH, "rb") as orig:
        assert orig.read() == download_path.read_bytes()

def test_share_folder(client):
    global shared_folder_token
    resp = client.post("/folders/testfolder/share")
    assert resp.status_code == 200
    assert "access/folder/" in resp.json()["message"]
    url = resp.json()["message"]
    shared_folder_token = url.split("/")[-1]
    assert shared_folder_token

def test_access_shared_folder_info():
    url = f"{API_URL}/access/folder/{shared_folder_token}"
    resp = httpx.get(url)
    assert resp.status_code == 200
    filenames = [f["filename"] for f in resp.json()]
    assert "test.txt" in filenames

def test_download_file_from_shared_folder(tmp_path):
    url = f"{API_URL}/access/folder/{shared_folder_token}/test.txt/download"
    resp = httpx.get(url)
    assert resp.status_code == 200
    download_path = tmp_path / "public_folder_downloaded_test.txt"
    with open(download_path, "wb") as f:
        f.write(resp.content)
    with open(TEST_FILE_PATH, "rb") as orig:
        assert orig.read() == download_path.read_bytes()

def test_revoke_share_file(client):
    url = f"/access/revoke/{shared_file_token}"
    resp = client.post(url)
    assert resp.status_code == 200
    assert "revoked" in resp.json()["message"]

def test_revoke_share_folder(client):
    url = f"/access/revoke/{shared_folder_token}"
    resp = client.post(url)
    assert resp.status_code == 200
    assert "revoked" in resp.json()["message"]

def test_access_revoked_file():
    url = f"{API_URL}/access/file/{shared_file_token}"
    resp = httpx.get(url)
    assert resp.status_code in (401, 404)

def test_access_revoked_folder():
    url = f"{API_URL}/access/folder/{shared_folder_token}"
    resp = httpx.get(url)
    assert resp.status_code in (401, 404)
