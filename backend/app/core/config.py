from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Runtime settings loaded from the environment or the root .env file."""

    app_name: str = "OPTIMUS API"
    environment: str = "development"
    version: str = "1.0.0"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"
    gemini_temperature: float = Field(default=0.5, ge=0.4, le=0.6)
    gemini_timeout_seconds: float = Field(default=15.0, gt=0.0, le=60.0)
    model_config = SettingsConfigDict(env_file=PROJECT_ROOT / ".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
