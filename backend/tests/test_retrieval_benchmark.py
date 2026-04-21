"""Small deterministic checks for ranking semantics (Gate 5 quality smoke)."""

from app.retrieval.similarity import cosine_similarity


def test_cosine_prefers_aligned_vector() -> None:
    q = [1.0, 0.0, 0.0]
    aligned = [1.0, 0.0, 0.0]
    orthogonal = [0.0, 1.0, 0.0]
    assert cosine_similarity(q, aligned) > cosine_similarity(q, orthogonal)


def test_cosine_zero_for_mismatched_length() -> None:
    assert cosine_similarity([1.0], [1.0, 1.0]) == 0.0
