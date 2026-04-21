from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.book_export import build_markdown_export, build_toc_entries
from app.db import get_db_session
from app.dependencies import get_book_for_user, get_current_user, get_project_for_user
from app.models import Book, BookAssignment, OutlineNode, Project, RawText, User
from app.schemas import (
    BookAssignmentCreate,
    BookAssignmentResponse,
    BookCreate,
    BookResponse,
    BookTocResponse,
    OutlineNodeCreate,
    OutlineNodeResponse,
)

router = APIRouter(tags=["books"])
logger = logging.getLogger("tooth.api.books")


@router.post(
    "/projects/{project_id}/books",
    response_model=BookResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_book(
    project_id: uuid.UUID,
    payload: BookCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> BookResponse:
    project = get_project_for_user(project_id, user, db)
    book = Book(id=uuid.uuid4(), project_id=project.id, title=payload.title)
    db.add(book)
    db.commit()
    db.refresh(book)
    logger.info("book_created book_id=%s project_id=%s", book.id, project.id)
    return BookResponse(
        id=book.id,
        project_id=book.project_id,
        title=book.title,
        archived=book.archived,
        created_at=book.created_at,
    )


@router.get("/projects/{project_id}/books", response_model=list[BookResponse])
def list_books(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[BookResponse]:
    project = get_project_for_user(project_id, user, db)
    rows = db.scalars(
        select(Book)
        .where(Book.project_id == project.id, Book.archived.is_(False))
        .order_by(Book.created_at)
    ).all()
    return [
        BookResponse(
            id=r.id,
            project_id=r.project_id,
            title=r.title,
            archived=r.archived,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post(
    "/books/{book_id}/nodes",
    response_model=OutlineNodeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_outline_node(
    book_id: uuid.UUID,
    payload: OutlineNodeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> OutlineNodeResponse:
    book = get_book_for_user(book_id, user, db)
    if payload.parent_id is not None:
        parent = db.get(OutlineNode, payload.parent_id)
        if parent is None or parent.book_id != book.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent node not in this book",
            )
    node = OutlineNode(
        id=uuid.uuid4(),
        book_id=book.id,
        parent_id=payload.parent_id,
        title=payload.title,
        sort_order=payload.sort_order,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    logger.info("outline_node_created node_id=%s book_id=%s", node.id, book.id)
    return OutlineNodeResponse(
        id=node.id,
        book_id=node.book_id,
        parent_id=node.parent_id,
        title=node.title,
        sort_order=node.sort_order,
        created_at=node.created_at,
    )


@router.post(
    "/books/{book_id}/assignments",
    response_model=BookAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    book_id: uuid.UUID,
    payload: BookAssignmentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> BookAssignmentResponse:
    book = get_book_for_user(book_id, user, db)
    node = db.get(OutlineNode, payload.outline_node_id)
    if node is None or node.book_id != book.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Outline node not in this book",
        )
    rt = db.scalar(
        select(RawText).join(Project, RawText.project_id == Project.id).where(
            RawText.id == payload.raw_text_id,
            Project.owner_id == user.id,
            RawText.archived.is_(False),
        )
    )
    if rt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raw text not found")
    if rt.project_id != book.project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw text must belong to the same project as the book",
        )
    a = BookAssignment(
        id=uuid.uuid4(),
        book_id=book.id,
        outline_node_id=node.id,
        raw_text_id=rt.id,
        sort_order=payload.sort_order,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    logger.info("book_assignment_created assignment_id=%s book_id=%s", a.id, book.id)
    return BookAssignmentResponse(
        id=a.id,
        book_id=a.book_id,
        outline_node_id=a.outline_node_id,
        raw_text_id=a.raw_text_id,
        sort_order=a.sort_order,
        created_at=a.created_at,
    )


@router.get("/books/{book_id}/nodes", response_model=list[OutlineNodeResponse])
def list_outline_nodes(
    book_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[OutlineNodeResponse]:
    book = get_book_for_user(book_id, user, db)
    rows = db.scalars(
        select(OutlineNode)
        .where(OutlineNode.book_id == book.id)
        .order_by(OutlineNode.sort_order, OutlineNode.created_at)
    ).all()
    return [
        OutlineNodeResponse(
            id=r.id,
            book_id=r.book_id,
            parent_id=r.parent_id,
            title=r.title,
            sort_order=r.sort_order,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/books/{book_id}/assignments", response_model=list[BookAssignmentResponse])
def list_book_assignments(
    book_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[BookAssignmentResponse]:
    book = get_book_for_user(book_id, user, db)
    rows = db.scalars(
        select(BookAssignment)
        .where(BookAssignment.book_id == book.id)
        .order_by(BookAssignment.sort_order, BookAssignment.created_at)
    ).all()
    return [
        BookAssignmentResponse(
            id=r.id,
            book_id=r.book_id,
            outline_node_id=r.outline_node_id,
            raw_text_id=r.raw_text_id,
            sort_order=r.sort_order,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/books/{book_id}/export", response_class=Response)
def export_book_markdown(
    book_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Response:
    book = get_book_for_user(book_id, user, db)
    md = build_markdown_export(db, book)
    logger.info("book_export book_id=%s bytes=%s", book.id, len(md.encode("utf-8")))
    return Response(
        content=md,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="book-{book.id}.md"'},
    )


@router.get("/books/{book_id}/toc", response_model=BookTocResponse)
def book_toc(
    book_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> BookTocResponse:
    book = get_book_for_user(book_id, user, db)
    entries = build_toc_entries(db, book)
    return BookTocResponse(book_id=book.id, title=book.title, entries=entries)
