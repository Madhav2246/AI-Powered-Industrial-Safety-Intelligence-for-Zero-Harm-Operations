"""
AegisOS Configuration
=====================
All settings loaded from environment variables via Pydantic Settings.
Defaults to local embedded SQLite database for zero-dependency execution.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str = "aegis-secret-key-2026"

    # Local Standalone Database (SQLite async)
    database_url: str = "sqlite+aiosqlite:///./aegis.db"

    # In-memory / Local Redis URL
    redis_url: str = "redis://localhost:6379"

    # OpenAI / LLM (optional)
    openai_api_key: str = ""
    llm_mode: str = "mock"    # "mock" or "openai"

    # Risk Engine Thresholds
    high_risk_threshold: float = 0.70
    critical_risk_threshold: float = 0.85

    # CORS
    cors_origins: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
