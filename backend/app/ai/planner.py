from __future__ import annotations

import re

# Heuristic escalation hints (cheap rule pass before any model call).
_ESCALATION = re.compile(
    r"\b(rewrite|restructure|re-structure|outline|chapter|book|continuity|"
    r"synthesize|deep\s+edit|structural|compare\s+and|line\s+by\s+line)\b",
    re.IGNORECASE,
)


def rule_prefers_escalation(user_message: str) -> bool:
    return bool(_ESCALATION.search(user_message))
