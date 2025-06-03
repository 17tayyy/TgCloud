from .handlers import (
    FileNotFoundException, file_not_found_exception_handler,
    FileUploadException, file_upload_exception_handler,
    FolderAlreadyExistsException, folder_already_exists_exception_handler,
    BadNameException, bad_name_exception_handler,
    FolderNotFoundException, folder_not_found_exception_handler,
    FolderNotDeletedException, folder_not_deteleted_exception_handler,
    FileAlreadyExistsException, file_already_exists_exception_handler,
)

exception_handlers = [
    (FileNotFoundException, file_not_found_exception_handler),
    (FileUploadException, file_upload_exception_handler),
    (FolderAlreadyExistsException, folder_already_exists_exception_handler),
    (BadNameException, bad_name_exception_handler),
    (FolderNotFoundException, folder_not_found_exception_handler),
    (FolderNotDeletedException, folder_not_deteleted_exception_handler),
    (FileAlreadyExistsException, file_already_exists_exception_handler),
]