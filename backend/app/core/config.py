from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "StorageOrganizer"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql://storage_user:storage_password@db:5432/storage_organizer"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://frontend:3000",
        "https://hoard.id",
        "http://hoard.id",
    ]

    # Auth
    AUTH_USERNAME: str = "admin"
    AUTH_PASSWORD_HASH: str = ""  # bcrypt hash
    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRE_HOURS: int = 720  # 30 days

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
