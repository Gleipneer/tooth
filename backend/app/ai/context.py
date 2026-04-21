from __future__ import annotations

from app.config import Settings


def truncate(text: str, max_chars: int) -> tuple[str, bool]:
    if len(text) <= max_chars:
        return text, False
    return text[:max_chars], True


def build_context_bundle(
    *,
    draft_excerpt: str,
    user_message: str,
    settings: Settings,
) -> dict[str, object]:
    """Assemble an explicit, bounded context package for provider calls and audit logs."""
    d, d_trunc = truncate(draft_excerpt, settings.ai_max_context_chars)
    u, u_trunc = truncate(user_message, settings.ai_max_user_message_chars)
    return {
        "draft_excerpt": d,
        "draft_truncated": d_trunc,
        "draft_excerpt_char_len": len(d),
        "user_message": u,
        "user_truncated": u_trunc,
        "user_message_char_len": len(u),
        "budget": {
            "max_context_chars": settings.ai_max_context_chars,
            "max_user_message_chars": settings.ai_max_user_message_chars,
        },
    }
