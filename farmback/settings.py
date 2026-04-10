from pydantic_settings import BaseSettings
from pydantic import validator
from typing import List


class Settings(BaseSettings):
    SECRET_KEY: str = "farmamap-secret-change-in-production"
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = "sqlite:///./farmback.db"

    # Allowed frontend origins for CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "app://.", "file://"]
    ALLOWED_PAYMENT_PROVIDERS: List[str] = ["mpesa", "emola", "card", "insurance"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("ALLOWED_ORIGINS", pre=True)
    def split_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
