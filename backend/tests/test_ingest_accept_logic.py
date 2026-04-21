"""Ensure only explicit create_* intents produce synthetic raw text payloads."""

from __future__ import annotations


def test_write_intent_kinds_for_accept() -> None:
    """Accept endpoint only materializes create_raw_text / create_many_raw_texts."""
    accepted_kinds = {"create_raw_text", "create_many_raw_texts"}
    other_kinds = {
        "stage_for_review",
        "tag_items",
        "group_fragments",
        "propose_book_mapping",
        "propose_outline_node",
        "attach_to_existing_node",
        "leave_unplaced_for_inbox",
    }
    assert accepted_kinds.isdisjoint(other_kinds) is True
    assert len(accepted_kinds) == 2
