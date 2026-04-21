"""Bounded text copies for search/embedding (not canonical edit surfaces)."""

from __future__ import annotations

# Mirrors file content for FTS; keeps DB row size predictable.
SEARCH_TEXT_MAX_CHARS = 100_000


def truncate_for_search(content: str) -> str:
    if len(content) <= SEARCH_TEXT_MAX_CHARS:
        return content
    return content[:SEARCH_TEXT_MAX_CHARS]
