import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler

LOG_DIR = Path('/var/log/museum-system')

def setup_logger():
    """Setup application logger"""
    
    # Create log directory if not exists
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create logger
    logger = logging.getLogger('museum_app')
    logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_format)
    
    # File handler
    file_handler = RotatingFileHandler(
        LOG_DIR / 'app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )
    file_handler.setFormatter(file_format)
    
    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

def app_logger():
    """Get or create application logger"""
    logger = logging.getLogger('museum_app')
    if not logger.handlers:
        return setup_logger()
    return logger

if __name__ == '__main__':
    logger = app_logger()
    logger.info("Logger test successful")
