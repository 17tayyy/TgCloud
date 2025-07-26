"""
Structured logging configuration for TgCloud
"""
import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.config import settings

class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs structured JSON logs
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
            
        # Add user context if available
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'operation_id'):
            log_entry["operation_id"] = record.operation_id
            
        return json.dumps(log_entry, ensure_ascii=False)

class TgCloudLogger:
    """
    Enhanced logger with structured logging capabilities
    """
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        
    def _log_with_context(
        self, 
        level: int, 
        message: str, 
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        operation_id: Optional[str] = None,
        extra_fields: Optional[Dict[str, Any]] = None,
        exc_info: bool = False
    ):
        """Log with additional context"""
        record = self.logger.makeRecord(
            name=self.logger.name,
            level=level,
            fn="",
            lno=0,
            msg=message,
            args=(),
            exc_info=exc_info
        )
        
        if user_id:
            record.user_id = user_id
        if request_id:
            record.request_id = request_id
        if operation_id:
            record.operation_id = operation_id
        if extra_fields:
            record.extra_fields = extra_fields
            
        self.logger.handle(record)
    
    def info(self, message: str, **kwargs):
        self._log_with_context(logging.INFO, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log_with_context(logging.ERROR, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log_with_context(logging.WARNING, message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self._log_with_context(logging.DEBUG, message, **kwargs)

def setup_logging():
    """
    Configure structured logging for the application
    """
    # Create structured formatter
    formatter = StructuredFormatter()
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("telethon").setLevel(logging.WARNING)
    
    return TgCloudLogger("tgcloud")

# Global logger instance
logger = setup_logging()
