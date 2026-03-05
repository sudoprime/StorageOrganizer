from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "StorageOrganizer"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql://storage_user:storage_password@db:5432/storage_organizer"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://frontend:3000"
    ]

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
