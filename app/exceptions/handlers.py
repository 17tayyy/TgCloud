from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

class FileNotFoundException(Exception):
    def __init__(self, filename: str):
        self.filename = filename

async def file_not_found_exception_handler(request: Request, exc: FileNotFoundException):
    return JSONResponse(
        status_code=404,
        content={"detail": f"File '{exc.filename}' not found"}
    )

class FileUploadException(Exception):
    def __init__(self, reason: str):
        self.reason = reason

async def file_upload_exception_handler(request: Request, exc: FileUploadException):
    return JSONResponse(
        status_code=500,
        content={"detail": f"File upload failed: {exc.reason}"}
    )

class FolderAlreadyExistsException(Exception):
    def __init__(self, foldername: str):
        self.foldername = foldername

async def folder_already_exists_exception_handler(request: Request, exc: FolderAlreadyExistsException):
    return JSONResponse(
        status_code=409,
        content={"detail": f"Folder '{exc.foldername}' already exists"}
    )

class BadNameException(Exception):
    def __init__(self, name: str):
        self.name = name

async def bad_name_exception_handler(request: Request, exc: BadNameException):
    return JSONResponse(
        status_code=400,
        content={"detail": "Bad request (invalid characters)"}
    )

class FolderNotFound(Exception):
    def __init__(self, foldername: str):
        self.foldername = foldername

async def folder_not_found(request: Request, exc: FolderNotFound):
    return JSONResponse(
        status_code=404,
        content={"detail": f"Folder '{exc.foldername}' not found"}
    )

class FolderNotDeleted(Exception):
    def __init__(self, foldername: str):
        self.foldername = foldername

async def folder_not_deteleted(request: Request, exc: FolderNotDeleted):
    return JSONResponse(
        status_code = 500,
        content={"detail": f"Error while trying to delete the folder '{exc.foldername}'"}
    )
