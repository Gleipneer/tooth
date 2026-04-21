from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select

from app.api import router
from app.api_ai import router as ai_router
from app.api_book import router as book_router
from app.api_ingest import router as ingest_router
from app.api_search import router as search_router
from app.config import get_settings
from app.db import SessionLocal
from app.logging_config import configure_logging, logger
from app.models import User
from app.security import hash_password
from app.storage import TextStorage


def ensure_bootstrap_user() -> None:
    settings = get_settings()
    with SessionLocal() as session:
        existing_user = session.scalar(select(User).where(User.email == settings.bootstrap_email))
        if existing_user is not None:
            return

        user = User(
            email=settings.bootstrap_email,
            password_hash=hash_password(settings.bootstrap_password),
            is_active=True,
        )
        session.add(user)
        session.commit()
        logger.info("bootstrap_user_created email=%s", settings.bootstrap_email)


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    TextStorage().ensure_layout()
    try:
        ensure_bootstrap_user()
    except Exception as exc:  # noqa: BLE001
        logger.warning("bootstrap_user_unavailable error=%s", exc)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)
app.include_router(search_router, prefix=settings.api_prefix)
app.include_router(ingest_router, prefix=settings.api_prefix)
app.include_router(book_router, prefix=settings.api_prefix)
