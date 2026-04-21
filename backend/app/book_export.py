"""Deterministic Markdown export from book outline + assignments (read-only on source files)."""

from __future__ import annotations

import uuid
from collections import defaultdict
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Book, BookAssignment, OutlineNode, RawText
from app.storage import TextStorage


def _heading_hashes(depth: int) -> str:
    """Markdown heading level 2–6 from outline depth (0 = top-level section under book title)."""
    level = max(2, min(2 + depth, 6))
    return "#" * level


def _node_depth(node: OutlineNode, by_id: dict[uuid.UUID, OutlineNode]) -> int:
    d = 0
    p = node.parent_id
    while p is not None:
        d += 1
        parent = by_id.get(p)
        if parent is None:
            break
        p = parent.parent_id
    return d


def walk_nodes_preorder(nodes: Sequence[OutlineNode]) -> list[OutlineNode]:
    """Depth-first pre-order: children sorted by sort_order."""
    children: dict[uuid.UUID | None, list[OutlineNode]] = defaultdict(list)
    for n in nodes:
        children[n.parent_id].append(n)
    for lst in children.values():
        lst.sort(key=lambda x: (x.sort_order, x.created_at))

    out: list[OutlineNode] = []

    def visit(parent: uuid.UUID | None) -> None:
        for node in children[parent]:
            out.append(node)
            visit(node.id)

    visit(None)
    return out


def build_markdown_export(db: Session, book: Book) -> str:
    """Synthesize Markdown from DB + raw text files; does not modify sources."""
    nodes = db.scalars(
        select(OutlineNode).where(OutlineNode.book_id == book.id).order_by(OutlineNode.created_at)
    ).all()
    if not nodes:
        return f"# {book.title}\n\n"

    assigns = db.scalars(
        select(BookAssignment).where(BookAssignment.book_id == book.id)
    ).all()
    by_node: dict[uuid.UUID, list[BookAssignment]] = defaultdict(list)
    for a in assigns:
        by_node[a.outline_node_id].append(a)
    for lst in by_node.values():
        lst.sort(key=lambda x: (x.sort_order, x.created_at))

    by_id = {n.id: n for n in nodes}
    order = walk_nodes_preorder(nodes)
    storage = TextStorage()
    parts: list[str] = [f"# {book.title}\n"]

    for node in order:
        depth = _node_depth(node, by_id)
        parts.append(f"\n{_heading_hashes(depth)} {node.title}\n\n")
        for a in by_node.get(node.id, []):
            rt = db.get(RawText, a.raw_text_id)
            if rt is None or rt.archived:
                continue
            try:
                body = storage.read_text(rt.content_path)
            except OSError:
                body = ""
            parts.append(f"<!-- raw_text_id={rt.id} title={rt.title!r} -->\n\n")
            parts.append(body.rstrip())
            parts.append("\n\n")

    return "".join(parts).rstrip() + "\n"


def build_toc_entries(db: Session, book: Book) -> list[dict[str, object]]:
    """Structured TOC for UI (same walk order as export)."""
    nodes = db.scalars(select(OutlineNode).where(OutlineNode.book_id == book.id)).all()
    if not nodes:
        return []
    by_id = {n.id: n for n in nodes}
    order = walk_nodes_preorder(nodes)
    out: list[dict[str, object]] = []
    for node in order:
        out.append(
            {
                "node_id": str(node.id),
                "title": node.title,
                "depth": _node_depth(node, by_id),
                "sort_order": node.sort_order,
            }
        )
    return out
