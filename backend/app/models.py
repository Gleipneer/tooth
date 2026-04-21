from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    projects: Mapped[list[Project]] = relationship(back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    owner: Mapped[User] = relationship(back_populates="projects")
    raw_texts: Mapped[list[RawText]] = relationship(back_populates="project")
    drafts: Mapped[list[Draft]] = relationship(back_populates="project")
    ingest_review_items: Mapped[list["IngestReviewItem"]] = relationship(back_populates="project")
    books: Mapped[list["Book"]] = relationship(back_populates="project")


class RawText(Base):
    __tablename__ = "raw_texts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    content_path: Mapped[str] = mapped_column(String(500), unique=True)
    media_type: Mapped[str] = mapped_column(String(50), default="text/markdown")
    origin: Mapped[str] = mapped_column(String(50), default="manual")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    # Bounded mirror of file content for PostgreSQL FTS (not a second canonical copy for edits).
    search_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(80), nullable=True)

    project: Mapped[Project] = relationship(back_populates="raw_texts")
    drafts: Mapped[list[Draft]] = relationship(back_populates="raw_text")


class Draft(Base):
    __tablename__ = "drafts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id"), index=True)
    raw_text_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("raw_texts.id"), index=True)
    parent_draft_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("drafts.id"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255))
    branch_name: Mapped[str] = mapped_column(String(120), default="main")
    status: Mapped[str] = mapped_column(String(50), default="in_progress")
    content_path: Mapped[str] = mapped_column(String(500), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)

    project: Mapped[Project] = relationship(back_populates="drafts")
    raw_text: Mapped[RawText] = relationship(back_populates="drafts")
    parent_draft: Mapped[Draft | None] = relationship(remote_side=[id])


class AIOperation(Base):
    """Audit row for each AI assist request (routing, tokens, bounded context snapshot)."""

    __tablename__ = "ai_operations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id"), index=True)
    draft_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("drafts.id"),
        nullable=True,
        index=True,
    )
    task_class: Mapped[str] = mapped_column(String(80))
    route_final: Mapped[str] = mapped_column(String(40))
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    cheap_rounds: Mapped[int] = mapped_column(Integer, default=0)
    models_used_json: Mapped[str] = mapped_column(Text, default="[]")
    token_usage_json: Mapped[str] = mapped_column(Text, default="{}")
    context_bundle_json: Mapped[str] = mapped_column(Text, default="{}")
    response_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class IngestReviewItem(Base):
    """Staged paste/ingest proposals; canonical raw texts are created only on explicit accept."""

    __tablename__ = "ingest_review_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    payload_json: Mapped[str] = mapped_column(Text, default="{}")
    ai_operation_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("ai_operations.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped[Project] = relationship(back_populates="ingest_review_items")


class Book(Base):
    """Outline-based assembly; export synthesizes Markdown without mutating sources."""

    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped[Project] = relationship(back_populates="books")
    outline_nodes: Mapped[list["OutlineNode"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )
    assignments: Mapped[list["BookAssignment"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )


class OutlineNode(Base):
    __tablename__ = "outline_nodes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("books.id"), index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("outline_nodes.id"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    book: Mapped[Book] = relationship(back_populates="outline_nodes")
    parent: Mapped[OutlineNode | None] = relationship(
        "OutlineNode",
        remote_side="OutlineNode.id",
        back_populates="children",
    )
    children: Mapped[list[OutlineNode]] = relationship(
        "OutlineNode",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    slot_assignments: Mapped[list["BookAssignment"]] = relationship(
        back_populates="outline_node",
        cascade="all, delete-orphan",
    )


class BookAssignment(Base):
    """Links a raw text into an outline slot (explicit placement; no merge into source files)."""

    __tablename__ = "book_assignments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("books.id"), index=True)
    outline_node_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("outline_nodes.id"),
        index=True,
    )
    raw_text_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("raw_texts.id"), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    book: Mapped[Book] = relationship(back_populates="assignments")
    outline_node: Mapped[OutlineNode] = relationship(back_populates="slot_assignments")
    raw_text: Mapped[RawText] = relationship()
