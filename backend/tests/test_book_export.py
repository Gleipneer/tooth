"""Deterministic book export helpers."""

import uuid

from app.book_export import _heading_hashes, walk_nodes_preorder
from app.models import OutlineNode


def test_heading_hashes_depth() -> None:
    assert _heading_hashes(0) == "##"
    assert _heading_hashes(1) == "###"
    assert _heading_hashes(10) == "######"


def test_walk_preorder_order() -> None:
    b = uuid.uuid4()
    r1 = uuid.uuid4()
    r2 = uuid.uuid4()
    c1 = uuid.uuid4()
    nodes = [
        OutlineNode(id=r1, book_id=b, parent_id=None, title="A", sort_order=1),
        OutlineNode(id=r2, book_id=b, parent_id=None, title="B", sort_order=0),
        OutlineNode(id=c1, book_id=b, parent_id=r2, title="B1", sort_order=0),
    ]
    out = walk_nodes_preorder(nodes)
    titles = [n.title for n in out]
    assert titles == ["B", "B1", "A"]
