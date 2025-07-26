from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class TgCloudError(Exception):
    """Base exception for TgCloud specific errors"""
    
    def __init__(
        self, 
        message: str, 
        code: str, 
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(TgCloudError):
    """Validation related errors"""
    def __init__(self, message: str, field: str = None, details: Dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field": field, **(details or {})}
        )

class AuthenticationError(TgCloudError):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            code="AUTH_ERROR", 
            status_code=status.HTTP_401_UNAUTHORIZED
        )

class AuthorizationError(TgCloudError):
    """Authorization related errors"""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN
        )

class NotFoundError(TgCloudError):
    """Resource not found errors"""
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": identifier}
        )

class ConflictError(TgCloudError):
    """Resource conflict errors"""
    def __init__(self, message: str, resource: str = None):
        super().__init__(
            message=message,
            code="CONFLICT_ERROR",
            status_code=status.HTTP_409_CONFLICT,
            details={"resource": resource}
        )

class ExternalServiceError(TgCloudError):
    """External service related errors (Telegram, etc.)"""
    def __init__(self, service: str, message: str = None):
        message = message or f"{service} service unavailable"
        super().__init__(
            message=message,
            code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service}
        )

def create_error_response(error: TgCloudError) -> JSONResponse:
    """Create standardized error response"""
    logger.error(f"TgCloudError: {error.code} - {error.message}", extra={
        "error_code": error.code,
        "status_code": error.status_code,
        "details": error.details
    })
    
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "message": error.message,
                "code": error.code,
                "details": error.details
            }
        }
    )

async def tgcloud_error_handler(request, exc: TgCloudError):
    """FastAPI exception handler for TgCloudError"""
    return create_error_response(exc)

async def general_exception_handler(request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    error = TgCloudError(
        message="An unexpected error occurred",
        code="INTERNAL_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
    return create_error_response(error)

# Exception handlers mapping
exception_handlers = [
    (TgCloudError, tgcloud_error_handler),
    (Exception, general_exception_handler),
]
