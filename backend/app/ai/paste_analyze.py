"""Structured paste analysis for controlled ingest (no silent writes)."""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from app.ai.openai_client import chat_json
from app.config import Settings, get_settings
from app.models import AIOperation, IngestReviewItem, Project, User

logger = logging.getLogger("tooth.ai.paste")

PASTE_SYSTEM = """You are a structured ingest assistant for Tooth writing system.
Return ONLY valid JSON with keys:
- interpretation: one of single, multi_fragment, uncertain
- confidence: number between 0 and 1
- fragments: array of objects with id (string), title (string), body (string),
  tags (array of strings)
- write_intents: array of objects. Each must include kind, one of:
  create_raw_text (fields: title, body, tags optional)
  create_many_raw_texts (field items: array of {title, body})
  stage_for_review (fields: reason, fragment_ids optional)
  tag_items (fields: tags, fragment_ids optional)
  group_fragments (fields: label, fragment_ids)
  propose_book_mapping (fields: outline_hint, fragment_ids)
  propose_outline_node (fields: title, fragment_ids)
  attach_to_existing_node (fields: node_hint, fragment_ids)
  leave_unplaced_for_inbox (fields: fragment_ids)
- needs_review: boolean — true when splitting or classification is uncertain
- explanation: short string describing what was inferred

Rules: never propose mutating existing raw text files; creation is explicit only.
Use conservative splitting; if unsure, set needs_review true and prefer fewer fragments.
Book/outline fields are proposals only — no real node IDs unless user supplied them in context."""


def run_paste_analyze(
    *,
    db: Session,
    user: User,
    project: Project,
    pasted_text: str,
    client: OpenAI,
    settings: Settings | None = None,
) -> tuple[AIOperation, IngestReviewItem, dict[str, Any]]:
    """Call cheap model; persist audit + staged review row. Does not create raw texts."""
    settings = settings or get_settings()
    cheap = settings.openai_cheap_model
    bundle = {
        "pasted_char_len": len(pasted_text),
        "pasted_preview": pasted_text[:4_000],
        "instruction": "Analyze pasted text for ingest; return structured JSON only.",
    }
    user_block = json.dumps(bundle, ensure_ascii=False)
    response_body, usage = chat_json(
        client,
        model=cheap,
        system=PASTE_SYSTEM,
        user=user_block,
        max_tokens=3_000,
    )
    models_used = json.dumps([cheap])
    usage_json = json.dumps(
        {
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
        }
    )
    context_json = json.dumps(
        {
            "pasted_char_len": len(pasted_text),
            "budget": {"paste_max_chars": settings.paste_max_chars},
        },
        ensure_ascii=False,
    )
    op = AIOperation(
        id=uuid.uuid4(),
        user_id=user.id,
        project_id=project.id,
        draft_id=None,
        task_class="paste_analyze",
        route_final="cheap_only",
        escalated=False,
        cheap_rounds=1,
        models_used_json=models_used,
        token_usage_json=usage_json,
        context_bundle_json=context_json,
        response_json=json.dumps(response_body, ensure_ascii=False),
    )
    db.add(op)
    db.flush()

    payload = {
        "paste_analysis": response_body,
        "pasted_char_len": len(pasted_text),
    }
    item = IngestReviewItem(
        id=uuid.uuid4(),
        project_id=project.id,
        user_id=user.id,
        status="pending",
        payload_json=json.dumps(payload, ensure_ascii=False),
        ai_operation_id=op.id,
    )
    db.add(item)
    db.commit()
    db.refresh(op)
    db.refresh(item)
    logger.info(
        "paste_analyze_complete operation_id=%s review_id=%s needs_review=%s",
        op.id,
        item.id,
        response_body.get("needs_review"),
    )
    return op, item, response_body
