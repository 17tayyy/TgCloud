import os
from cryptography.fernet import Fernet

KEY_PATH = "./encryption.key"

def get_or_create_key():
    if not os.path.exists(KEY_PATH):
        key = Fernet.generate_key()
        with open(KEY_PATH, "wb") as key_file:
            key_file.write(key)
    else:
        with open(KEY_PATH, "rb") as key_file:
            key = key_file.read()
    return key

def encrypt_file(file_path):
    key = get_or_create_key()
    fernet = Fernet(key)
    with open(file_path, "rb") as file:
        original_data = file.read()
    encrypted_data = fernet.encrypt(original_data)
    with open(file_path, "wb") as encrypted_file:
        encrypted_file.write(encrypted_data)
    return file_path

def decrypt_file(file_path):
    if not os.path.exists(KEY_PATH):
        raise FileNotFoundError("Encryption key not found. Cannot decrypt the file.")
    with open(KEY_PATH, "rb") as key_file:
        key = key_file.read()
    fernet = Fernet(key)
    with open(file_path, "rb") as file:
        encrypted_data = file.read()
    decrypted_data = fernet.decrypt(encrypted_data)
    with open(file_path, "wb") as file:
        file.write(decrypted_data)
    return file_path