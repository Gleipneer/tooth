from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (parent of app/)
BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Tooth API"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://tooth:tooth@localhost:5432/tooth"
    data_dir: Path = REPO_ROOT / "data"

    jwt_secret_key: str = Field(
        default="change-me-before-production-phase",
        min_length=16,
    )
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 8

    bootstrap_email: str = "admin@example.com"
    bootstrap_password: str = "tooth-dev-password"

    # Phase 4 (OpenAI-compatible): optional until chat/AI code reads them.
    # Env names match the OpenAI Python SDK: OPENAI_API_KEY, OPENAI_BASE_URL.
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    # Primary deep / expensive model (escalation path). Falls back if unset.
    openai_default_model: str | None = None
    # Cheaper model for classification, routing, and lightweight passes.
    openai_cheap_model: str = "gpt-4o-mini"
    # Expensive model when escalation is required (defaults to openai_default_model or gpt-4o).
    openai_expensive_model: str = "gpt-4o"
    # Bounded context: max chars from draft included in any provider call.
    ai_max_context_chars: int = 12_000
    ai_max_user_message_chars: int = 4_000
    # Cap cheap completion rounds per request (planner + answer, or multi-pass).
    ai_max_cheap_rounds: int = 3

    # Phase 5: embeddings (semantic retrieval) and paste ingest bounds.
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_max_chars: int = 8_000
    search_max_results: int = 25
    semantic_scan_max_raw_texts: int = 500
    paste_max_chars: int = 50_000
    # Optional FTS snippets merged into AI assist context when use_retrieval=true.
    ai_retrieval_excerpt_chars: int = 800
    ai_retrieval_max_hits: int = 5


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
