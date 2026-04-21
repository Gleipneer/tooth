from __future__ import annotations

import difflib
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.openai_client import get_sync_client
from app.config import get_settings
from app.db import get_db_session
from app.dependencies import get_current_user, get_draft_for_user, get_project_for_user
from app.models import Draft, Project, RawText, User
from app.raw_text_index import try_index_raw_text
from app.schemas import (
    DraftBranchCreate,
    DraftCreate,
    DraftDiffResponse,
    DraftListItem,
    DraftResponse,
    DraftVersionCreate,
    HealthResponse,
    LoginRequest,
    ProjectCreate,
    ProjectResponse,
    RawTextCreate,
    RawTextImportResponse,
    RawTextListItem,
    TokenResponse,
    UserResponse,
)
from app.security import create_access_token, verify_password
from app.storage import TextStorage

router = APIRouter()
logger = logging.getLogger("tooth.api")


def draft_to_response(draft: Draft, storage: TextStorage) -> DraftResponse:
    content = storage.read_text(draft.content_path)
    return DraftResponse(
        id=draft.id,
        raw_text_id=draft.raw_text_id,
        parent_draft_id=draft.parent_draft_id,
        title=draft.title,
        branch_name=draft.branch_name,
        status=draft.status,
        archived=draft.archived,
        created_at=draft.created_at,
        content=content,
    )


@router.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", app_name=settings.app_name)


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_session)) -> TokenResponse:
    user = db.scalar(
        select(User).where(
            User.email == payload.email,
            User.is_active.is_(True),
        )
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    logger.info("login_success email=%s", user.email)
    return TokenResponse(access_token=token)


@router.get("/auth/me", response_model=UserResponse)
def auth_me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(id=user.id, email=user.email, is_active=user.is_active)


@router.get("/projects", response_model=list[ProjectResponse])
def list_projects(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[ProjectResponse]:
    projects = db.scalars(
        select(Project)
        .where(Project.owner_id == user.id, Project.archived.is_(False))
        .order_by(Project.created_at)
    ).all()
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            archived=project.archived,
            created_at=project.created_at,
        )
        for project in projects
    ]


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> ProjectResponse:
    project = Project(
        owner_id=user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info(
        "project_created project_id=%s owner_id=%s",
        project.id,
        user.id,
    )
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        archived=project.archived,
        created_at=project.created_at,
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> ProjectResponse:
    project = get_project_for_user(project_id, user, db)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        archived=project.archived,
        created_at=project.created_at,
    )


@router.post(
    "/projects/{project_id}/rawtexts",
    response_model=RawTextImportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_raw_text(
    project_id: uuid.UUID,
    payload: RawTextCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> RawTextImportResponse:
    project = get_project_for_user(project_id, user, db)
    storage = TextStorage()
    raw_text = RawText(
        id=uuid.uuid4(),
        project_id=project.id,
        title=payload.title,
        media_type=payload.media_type,
        origin=payload.origin,
        content_path="",
    )
    raw_text.content_path = storage.write_raw_text(raw_text.id, payload.content)
    try_index_raw_text(raw_text, payload.content, get_sync_client(get_settings()))
    db.add(raw_text)
    db.commit()
    db.refresh(raw_text)
    logger.info(
        "raw_text_created raw_text_id=%s project_id=%s",
        raw_text.id,
        project.id,
    )
    return RawTextImportResponse(
        id=raw_text.id,
        title=raw_text.title,
        media_type=raw_text.media_type,
        origin=raw_text.origin,
        archived=raw_text.archived,
        created_at=raw_text.created_at,
        content=payload.content,
    )


@router.get("/projects/{project_id}/rawtexts", response_model=list[RawTextListItem])
def list_raw_texts(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[RawTextListItem]:
    project = get_project_for_user(project_id, user, db)
    raw_texts = db.scalars(
        select(RawText)
        .where(RawText.project_id == project.id, RawText.archived.is_(False))
        .order_by(RawText.created_at)
    ).all()
    return [
        RawTextListItem(
            id=raw_text.id,
            title=raw_text.title,
            media_type=raw_text.media_type,
            origin=raw_text.origin,
            archived=raw_text.archived,
            created_at=raw_text.created_at,
        )
        for raw_text in raw_texts
    ]


@router.post(
    "/projects/{project_id}/rawtexts/import",
    response_model=RawTextImportResponse,
    status_code=status.HTTP_201_CREATED,
)
def import_raw_text_file(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> RawTextImportResponse:
    project = get_project_for_user(project_id, user, db)
    if file.content_type not in {"text/plain", "text/markdown", "text/x-markdown"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type",
        )

    content = (file.file.read()).decode("utf-8")
    title = file.filename or "Untitled import"
    media_type = "text/markdown" if title.endswith(".md") else "text/plain"

    storage = TextStorage()
    raw_text = RawText(
        id=uuid.uuid4(),
        project_id=project.id,
        title=title,
        media_type=media_type,
        origin="import",
        content_path="",
    )
    raw_text.content_path = storage.write_raw_text(raw_text.id, content)
    try_index_raw_text(raw_text, content, get_sync_client(get_settings()))
    db.add(raw_text)
    db.commit()
    db.refresh(raw_text)
    logger.info(
        "raw_text_imported raw_text_id=%s project_id=%s",
        raw_text.id,
        project.id,
    )
    return RawTextImportResponse(
        id=raw_text.id,
        title=raw_text.title,
        media_type=raw_text.media_type,
        origin=raw_text.origin,
        archived=raw_text.archived,
        created_at=raw_text.created_at,
        content=content,
    )


@router.get("/projects/{project_id}/drafts", response_model=list[DraftListItem])
def list_drafts(
    project_id: uuid.UUID,
    raw_text_id: uuid.UUID | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[DraftListItem]:
    project = get_project_for_user(project_id, user, db)
    query = (
        select(Draft)
        .where(Draft.project_id == project.id, Draft.archived.is_(False))
        .order_by(Draft.created_at)
    )
    if raw_text_id is not None:
        query = query.where(Draft.raw_text_id == raw_text_id)

    drafts = db.scalars(query).all()
    return [
        DraftListItem(
            id=draft.id,
            raw_text_id=draft.raw_text_id,
            parent_draft_id=draft.parent_draft_id,
            title=draft.title,
            branch_name=draft.branch_name,
            status=draft.status,
            archived=draft.archived,
            created_at=draft.created_at,
        )
        for draft in drafts
    ]


@router.get("/rawtexts/{raw_text_id}", response_model=RawTextImportResponse)
def get_raw_text(
    raw_text_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> RawTextImportResponse:
    raw_text = db.scalar(
        select(RawText)
        .join(Project, RawText.project_id == Project.id)
        .where(
            RawText.id == raw_text_id,
            Project.owner_id == user.id,
            RawText.archived.is_(False),
        )
    )
    if raw_text is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raw text not found")

    storage = TextStorage()
    content = storage.read_text(raw_text.content_path)
    return RawTextImportResponse(
        id=raw_text.id,
        title=raw_text.title,
        media_type=raw_text.media_type,
        origin=raw_text.origin,
        archived=raw_text.archived,
        created_at=raw_text.created_at,
        content=content,
    )


@router.post(
    "/rawtexts/{raw_text_id}/drafts",
    response_model=DraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_draft(
    raw_text_id: uuid.UUID,
    payload: DraftCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftResponse:
    raw_text = db.scalar(
        select(RawText)
        .join(Project, RawText.project_id == Project.id)
        .where(
            RawText.id == raw_text_id,
            Project.owner_id == user.id,
            RawText.archived.is_(False),
        )
    )
    if raw_text is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raw text not found")

    storage = TextStorage()
    content = storage.read_text(raw_text.content_path)
    draft = Draft(
        id=uuid.uuid4(),
        project_id=raw_text.project_id,
        raw_text_id=raw_text.id,
        title=payload.title,
        branch_name=payload.branch_name,
        content_path="",
    )
    draft.content_path = storage.write_draft(draft.id, content)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    logger.info(
        "draft_created draft_id=%s raw_text_id=%s",
        draft.id,
        raw_text.id,
    )
    return draft_to_response(draft, storage)


@router.get("/drafts/{draft_id}", response_model=DraftResponse)
def get_draft(
    draft_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftResponse:
    draft = get_draft_for_user(draft_id, user, db)
    storage = TextStorage()
    return draft_to_response(draft, storage)


@router.get("/drafts/{draft_id}/versions", response_model=list[DraftListItem])
def list_draft_versions(
    draft_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[DraftListItem]:
    draft = get_draft_for_user(draft_id, user, db)
    versions = db.scalars(
        select(Draft)
        .where(
            Draft.raw_text_id == draft.raw_text_id,
            Draft.branch_name == draft.branch_name,
            Draft.archived.is_(False),
        )
        .order_by(Draft.created_at)
    ).all()
    return [
        DraftListItem(
            id=version.id,
            raw_text_id=version.raw_text_id,
            parent_draft_id=version.parent_draft_id,
            title=version.title,
            branch_name=version.branch_name,
            status=version.status,
            archived=version.archived,
            created_at=version.created_at,
        )
        for version in versions
    ]


@router.post(
    "/drafts/{draft_id}/save_version",
    response_model=DraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def save_draft_version(
    draft_id: uuid.UUID,
    payload: DraftVersionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftResponse:
    draft = get_draft_for_user(draft_id, user, db)
    if draft.status == "frozen":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot edit a frozen draft",
        )

    storage = TextStorage()
    new_draft = Draft(
        id=uuid.uuid4(),
        project_id=draft.project_id,
        raw_text_id=draft.raw_text_id,
        parent_draft_id=draft.id,
        title=payload.title or draft.title,
        branch_name=draft.branch_name,
        status="in_progress",
        content_path="",
    )
    new_draft.content_path = storage.write_draft(new_draft.id, payload.content)
    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)
    logger.info(
        "draft_version_created draft_id=%s parent_draft_id=%s",
        new_draft.id,
        draft.id,
    )
    return draft_to_response(new_draft, storage)


@router.post(
    "/drafts/{draft_id}/branch",
    response_model=DraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def branch_draft(
    draft_id: uuid.UUID,
    payload: DraftBranchCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftResponse:
    draft = get_draft_for_user(draft_id, user, db)
    storage = TextStorage()
    content = payload.content or storage.read_text(draft.content_path)
    branched_draft = Draft(
        id=uuid.uuid4(),
        project_id=draft.project_id,
        raw_text_id=draft.raw_text_id,
        parent_draft_id=draft.id,
        title=payload.title,
        branch_name=payload.branch_name,
        status="in_progress",
        content_path="",
    )
    branched_draft.content_path = storage.write_draft(branched_draft.id, content)
    db.add(branched_draft)
    db.commit()
    db.refresh(branched_draft)
    logger.info(
        "draft_branch_created draft_id=%s parent_draft_id=%s",
        branched_draft.id,
        draft.id,
    )
    return draft_to_response(branched_draft, storage)


@router.post("/drafts/{draft_id}/freeze", response_model=DraftResponse)
def freeze_draft(
    draft_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftResponse:
    draft = get_draft_for_user(draft_id, user, db)
    draft.status = "frozen"
    db.commit()
    db.refresh(draft)
    logger.info("draft_frozen draft_id=%s", draft.id)
    return draft_to_response(draft, TextStorage())


@router.post("/drafts/{draft_id}/unfreeze", response_model=DraftResponse)
def unfreeze_draft(
    draft_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftResponse:
    draft = get_draft_for_user(draft_id, user, db)
    draft.status = "in_progress"
    db.commit()
    db.refresh(draft)
    logger.info("draft_unfrozen draft_id=%s", draft.id)
    return draft_to_response(draft, TextStorage())


@router.get("/drafts/{draft_id}/diff", response_model=DraftDiffResponse)
def get_draft_diff(
    draft_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DraftDiffResponse:
    draft = get_draft_for_user(draft_id, user, db)
    storage = TextStorage()
    draft_content = storage.read_text(draft.content_path).splitlines(keepends=True)

    if draft.parent_draft_id is not None:
        parent_draft = get_draft_for_user(draft.parent_draft_id, user, db)
        baseline_content = storage.read_text(parent_draft.content_path).splitlines(keepends=True)
        parent_draft_id = parent_draft.id
        baseline_type = "parent_draft"
        from_name = f"draft:{parent_draft.id}"
    else:
        raw_text = db.scalar(select(RawText).where(RawText.id == draft.raw_text_id))
        if raw_text is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raw text not found")
        baseline_content = storage.read_text(raw_text.content_path).splitlines(keepends=True)
        parent_draft_id = None
        baseline_type = "raw_text"
        from_name = f"raw:{raw_text.id}"

    diff = "".join(
        difflib.unified_diff(
            baseline_content,
            draft_content,
            fromfile=from_name,
            tofile=f"draft:{draft.id}",
        )
    )

    return DraftDiffResponse(
        draft_id=draft.id,
        parent_draft_id=parent_draft_id,
        baseline_type=baseline_type,
        diff=diff,
    )
