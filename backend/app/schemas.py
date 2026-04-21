from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str
    app_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    archived: bool
    created_at: datetime


class RawTextListItem(BaseModel):
    id: UUID
    title: str
    media_type: str
    origin: str
    archived: bool
    created_at: datetime


class RawTextCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    media_type: str = Field(default="text/markdown", max_length=50)
    origin: str = Field(default="manual", max_length=50)


class RawTextImportResponse(BaseModel):
    id: UUID
    title: str
    media_type: str
    origin: str
    archived: bool
    created_at: datetime
    content: str


class DraftCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    branch_name: str = Field(default="main", min_length=1, max_length=120)


class DraftVersionCreate(BaseModel):
    content: str = Field(min_length=1)
    title: str | None = Field(default=None, min_length=1, max_length=255)


class DraftBranchCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    branch_name: str = Field(min_length=1, max_length=120)
    content: str | None = Field(default=None, min_length=1)


class DraftResponse(BaseModel):
    id: UUID
    raw_text_id: UUID
    parent_draft_id: UUID | None
    title: str
    branch_name: str
    status: str
    archived: bool
    created_at: datetime
    content: str


class DraftListItem(BaseModel):
    id: UUID
    raw_text_id: UUID
    parent_draft_id: UUID | None
    title: str
    branch_name: str
    status: str
    archived: bool
    created_at: datetime


class DraftDiffResponse(BaseModel):
    draft_id: UUID
    parent_draft_id: UUID | None
    baseline_type: str
    diff: str


class AIAssistRequest(BaseModel):
    project_id: UUID
    draft_id: UUID | None = None
    message: str = Field(min_length=1, max_length=4000)
    use_retrieval: bool = False
    retrieval_query: str | None = Field(default=None, max_length=500)


class AISuggestionItem(BaseModel):
    id: str
    title: str
    body: str
    apply_kind: str = "note"


class AIAssistResponse(BaseModel):
    operation_id: UUID
    task_class: str
    route_final: str
    escalated: bool
    cheap_rounds: int
    planner_reason: str | None = None
    context_bundle: dict[str, object]
    suggestions: list[AISuggestionItem]
    confidence: float
    token_usage: dict[str, int]


class AIOperationListItem(BaseModel):
    id: UUID
    project_id: UUID
    draft_id: UUID | None
    task_class: str
    route_final: str
    escalated: bool
    cheap_rounds: int
    created_at: datetime


class SearchHit(BaseModel):
    raw_text_id: UUID
    title: str
    score: float
    rank_kind: str


class SearchResponse(BaseModel):
    query: str
    mode: str
    hits: list[SearchHit]
    meta: dict[str, object] = Field(default_factory=dict)


class PasteAnalyzeRequest(BaseModel):
    project_id: UUID
    pasted_text: str = Field(min_length=1, max_length=50_000)


class PasteAnalyzeResponse(BaseModel):
    operation_id: UUID
    review_item_id: UUID
    analysis: dict[str, object]
    token_usage: dict[str, int]


class IngestReviewListItem(BaseModel):
    id: UUID
    project_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime


class IngestAcceptResponse(BaseModel):
    review_item_id: UUID
    created_raw_text_ids: list[UUID]
    status: str


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class BookResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    archived: bool
    created_at: datetime


class OutlineNodeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    parent_id: UUID | None = None
    sort_order: int = 0


class OutlineNodeResponse(BaseModel):
    id: UUID
    book_id: UUID
    parent_id: UUID | None
    title: str
    sort_order: int
    created_at: datetime


class BookAssignmentCreate(BaseModel):
    outline_node_id: UUID
    raw_text_id: UUID
    sort_order: int = 0


class BookAssignmentResponse(BaseModel):
    id: UUID
    book_id: UUID
    outline_node_id: UUID
    raw_text_id: UUID
    sort_order: int
    created_at: datetime


class BookTocResponse(BaseModel):
    book_id: UUID
    title: str
    entries: list[dict[str, object]]
