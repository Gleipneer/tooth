from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db_session
from app.models import Book, Draft, IngestReviewItem, Project, User
from app.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db_session),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )

    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["sub"])
    except Exception as exc:  # noqa: BLE001
        raise credentials_error from exc

    user = db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
    if user is None:
        raise credentials_error
    return user


def get_project_for_user(project_id: UUID, user: User, db: Session) -> Project:
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == user.id,
            Project.archived.is_(False),
        )
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def get_book_for_user(book_id: UUID, user: User, db: Session) -> Book:
    book = db.scalar(
        select(Book)
        .join(Project, Book.project_id == Project.id)
        .where(Book.id == book_id, Project.owner_id == user.id, Book.archived.is_(False))
    )
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


def get_ingest_review_for_user(item_id: UUID, user: User, db: Session) -> IngestReviewItem:
    row = db.scalar(
        select(IngestReviewItem)
        .join(Project, IngestReviewItem.project_id == Project.id)
        .where(IngestReviewItem.id == item_id, Project.owner_id == user.id)
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingest review item not found",
        )
    return row


def get_draft_for_user(draft_id: UUID, user: User, db: Session) -> Draft:
    draft = db.scalar(
        select(Draft)
        .join(Project, Draft.project_id == Project.id)
        .where(Draft.id == draft_id, Project.owner_id == user.id, Draft.archived.is_(False))
    )
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    return draft
