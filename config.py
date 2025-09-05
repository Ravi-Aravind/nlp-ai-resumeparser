
#!/usr/bin/env python3
"""
Configuration management for AI Hiring Management System
Loads settings from environment variables and .env files
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, EmailStr
import logging

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application settings
    app_name: str = "AI Hiring Management System"
    app_version: str = "2.1.0"
    debug: bool = True
    environment: str = "development"

    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 1

    # Database settings
    database_url: str = "sqlite:///./data/hiring_system.db"
    database_backup_dir: str = "./data/backups"

    # File storage
    upload_dir: str = "./uploads"
    max_file_size: int = 10485760  # 10MB

    # Google Calendar API
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_project_id: Optional[str] = None

    # LinkedIn API  
    linkedin_client_id: Optional[str] = None
    linkedin_client_secret: Optional[str] = None

    # Email configuration
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[EmailStr] = None
    smtp_password: Optional[str] = None

    # Security
    secret_key: str = "change_this_secret_key_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS settings
    allowed_origins: str = "http://localhost:3000,http://localhost:8080"

    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    class Config:
        env_file = ".env"
        case_sensitive = False

        # Map environment variable names
        fields = {
            'google_client_id': {'env': 'GOOGLE_CLIENT_ID'},
            'google_client_secret': {'env': 'GOOGLE_CLIENT_SECRET'},
            'google_project_id': {'env': 'GOOGLE_PROJECT_ID'},
            'linkedin_client_id': {'env': 'LINKEDIN_CLIENT_ID'},
            'linkedin_client_secret': {'env': 'LINKEDIN_CLIENT_SECRET'},
            'smtp_username': {'env': 'SMTP_USERNAME'},
            'smtp_password': {'env': 'SMTP_PASSWORD'},
            'secret_key': {'env': 'SECRET_KEY'}
        }

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() == "production"

    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=getattr(logging, self.log_level.upper()),
            format=self.log_format
        )

        # Set specific logger levels
        logging.getLogger("uvicorn").setLevel(logging.WARNING)
        logging.getLogger("fastapi").setLevel(logging.INFO)

# Create global settings instance
def get_settings() -> Settings:
    """Get application settings"""
    return Settings()

settings = get_settings()

# Setup logging
settings.setup_logging()

logger = logging.getLogger(__name__)
logger.info(f"Configuration loaded for {settings.environment} environment")

# Validate required settings
def validate_configuration():
    """Validate that required configuration is present"""
    warnings = []

    if not settings.google_client_id:
        warnings.append("Google Calendar API credentials not configured")

    if not settings.linkedin_client_id:
        warnings.append("LinkedIn API credentials not configured")

    if not settings.smtp_username:
        warnings.append("Email notifications not configured")

    if settings.secret_key == "change_this_secret_key_in_production":
        warnings.append("Default secret key detected - change for production")

    if warnings:
        for warning in warnings:
            logger.warning(f"Configuration warning: {warning}")

    return len(warnings) == 0

# Export settings
__all__ = ['settings', 'get_settings', 'validate_configuration']
