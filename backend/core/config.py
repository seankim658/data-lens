from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional


class Settings(BaseSettings):
    """Loads and validates application settings from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    LOG_LEVEL: Literal["debug", "info", "warning", "error"] = "info"
    OPENAI_API_KEY: Optional[str] = None
    API_SOURCE: str = "openai"
    SESSION_STORE_TYPE: str = "memory"
    REDIS_URL: str = "redis://localhost"


settings = Settings()
