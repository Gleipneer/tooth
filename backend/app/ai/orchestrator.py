from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from app.ai.context import build_context_bundle
from app.ai.openai_client import chat_json, expensive_model_name
from app.ai.planner import rule_prefers_escalation
from app.config import Settings, get_settings
from app.models import AIOperation, Draft, Project, User
from app.storage import TextStorage

logger = logging.getLogger("tooth.ai")

PLANNER_SYSTEM = """You are a routing planner for a writing assistant inside Tooth.
Return ONLY valid JSON with keys:
- task_class: one of simple_edit, summarize, classify, editorial_deep, structural, other
- needs_escalation: boolean — true only if the user needs nuanced judgment,
  structural book-level work, difficult continuity, or deep editorial synthesis that a small
  model should not do alone.
- reason: short string explaining the choice.
Never include raw corpus dumps. Be conservative: prefer needs_escalation=false when a cheap pass
suffices."""

ANSWER_SYSTEM = """You are an assistant for draft writing. Suggestions MUST NOT silently apply.
Return ONLY valid JSON with keys:
- suggestions: array of objects with keys id, title, body, apply_kind (strings).
  apply_kind must be one of: note, draft_patch (draft_patch means a replace suggestion for the
  draft only; nothing is applied automatically).
- confidence: number between 0 and 1.
Do not output entire documents unless necessary; keep bodies bounded."""

SUMMARY_SYSTEM = """Summarize the draft excerpt for a senior editor in <= 8 bullet points.
Return ONLY valid JSON: {\"bullets\": [\"...\", ...]}."""


def _merge_usage(acc: dict[str, int], part: dict[str, int]) -> None:
    acc["prompt_tokens"] = acc.get("prompt_tokens", 0) + part.get("prompt_tokens", 0)
    acc["completion_tokens"] = acc.get("completion_tokens", 0) + part.get(
        "completion_tokens", 0
    )
    acc["total_tokens"] = acc.get("total_tokens", 0) + part.get("total_tokens", 0)


def run_assist(
    *,
    db: Session,
    user: User,
    project: Project,
    draft: Draft | None,
    user_message: str,
    client: OpenAI,
    settings: Settings | None = None,
    use_retrieval: bool = False,
    retrieval_query: str | None = None,
) -> tuple[AIOperation, dict[str, Any], str | None]:
    """Run cheap routing and optional escalation; persist audit. Does not mutate draft files."""
    settings = settings or get_settings()
    storage = TextStorage()
    draft_text = ""
    if draft is not None:
        draft_text = storage.read_text(draft.content_path)

    bundle = build_context_bundle(
        draft_excerpt=draft_text,
        user_message=user_message,
        settings=settings,
    )
    if use_retrieval:
        from app.retrieval.for_ai import fts_snippets_for_ai

        rq = (retrieval_query or user_message).strip()[:500]
        if rq:
            bundle["retrieval_snippets"] = fts_snippets_for_ai(
                db,
                project_id=project.id,
                query=rq,
                excerpt_chars=settings.ai_retrieval_excerpt_chars,
                max_hits=settings.ai_retrieval_max_hits,
                settings=settings,
            )
            bundle["retrieval_query_used"] = rq
    cheap_model = settings.openai_cheap_model
    deep_model = expensive_model_name(settings)

    models_used: list[str] = []
    cheap_rounds = 0
    usage_total: dict[str, int] = {}
    planner_reason: str | None = None
    needs_escalation: bool
    task_class: str

    user_block = json.dumps(
        {
            "context_bundle": bundle,
            "instruction": "Plan routing for the user message only.",
        },
        ensure_ascii=False,
    )

    if rule_prefers_escalation(user_message):
        needs_escalation = True
        task_class = "editorial_deep"
        planner_reason = "rule_keyword_escalation"
    else:
        cheap_rounds += 1
        plan, u1 = chat_json(
            client,
            model=cheap_model,
            system=PLANNER_SYSTEM,
            user=user_block,
            max_tokens=400,
        )
        models_used.append(cheap_model)
        _merge_usage(usage_total, u1)
        needs_escalation = bool(plan.get("needs_escalation", False))
        task_class = str(plan.get("task_class", "other"))[:80]
        planner_reason = str(plan.get("reason", ""))[:500]

        if not needs_escalation and task_class in {"editorial_deep", "structural"}:
            needs_escalation = True
            planner_reason = (planner_reason or "") + "; forced_escalation_by_task_class"

    answer_base = json.dumps(
        {
            "context_bundle": bundle,
            "user_message": bundle["user_message"],
            "task_class": task_class,
            "planner_reason": planner_reason,
        },
        ensure_ascii=False,
    )

    if not needs_escalation:
        cheap_rounds += 1
        response_body, u2 = chat_json(
            client,
            model=cheap_model,
            system=ANSWER_SYSTEM,
            user=answer_base,
            max_tokens=1_800,
        )
        models_used.append(cheap_model)
        _merge_usage(usage_total, u2)
        route_final = "cheap_only"
        escalated = False
    else:
        summary_hint = ""
        if cheap_rounds < settings.ai_max_cheap_rounds:
            cheap_rounds += 1
            summ, u3 = chat_json(
                client,
                model=cheap_model,
                system=SUMMARY_SYSTEM,
                user=answer_base,
                max_tokens=500,
            )
            models_used.append(cheap_model)
            _merge_usage(usage_total, u3)
            summary_hint = json.dumps(summ, ensure_ascii=False)

        deep_user = json.dumps(
            {
                "context_bundle": bundle,
                "cheap_summary": summary_hint,
                "user_message": bundle["user_message"],
                "task_class": task_class,
            },
            ensure_ascii=False,
        )
        response_body, u4 = chat_json(
            client,
            model=deep_model,
            system=ANSWER_SYSTEM,
            user=deep_user,
            max_tokens=2_500,
        )
        models_used.append(deep_model)
        _merge_usage(usage_total, u4)
        route_final = "escalated"
        escalated = True

    op = AIOperation(
        id=uuid.uuid4(),
        user_id=user.id,
        project_id=project.id,
        draft_id=draft.id if draft else None,
        task_class=task_class,
        route_final=route_final,
        escalated=escalated,
        cheap_rounds=cheap_rounds,
        models_used_json=json.dumps(models_used),
        token_usage_json=json.dumps(usage_total),
        context_bundle_json=json.dumps(bundle, ensure_ascii=False),
        response_json=json.dumps(response_body, ensure_ascii=False),
    )
    db.add(op)
    db.commit()
    db.refresh(op)

    logger.info(
        "ai_assist_complete operation_id=%s route=%s escalated=%s cheap_rounds=%s "
        "models=%s tokens=%s",
        op.id,
        route_final,
        escalated,
        cheap_rounds,
        models_used,
        usage_total,
    )

    return op, response_body, planner_reason


def operation_to_response_dict(
    op: AIOperation,
    response_body: dict[str, Any],
    planner_reason: str | None,
) -> dict[str, Any]:
    suggestions = response_body.get("suggestions", [])
    if not isinstance(suggestions, list):
        suggestions = []
    return {
        "operation_id": op.id,
        "task_class": op.task_class,
        "route_final": op.route_final,
        "escalated": op.escalated,
        "cheap_rounds": op.cheap_rounds,
        "planner_reason": planner_reason,
        "context_bundle": json.loads(op.context_bundle_json),
        "suggestions": suggestions,
        "confidence": response_body.get("confidence", 0.5),
        "token_usage": json.loads(op.token_usage_json),
    }
