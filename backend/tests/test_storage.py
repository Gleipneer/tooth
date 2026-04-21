from pathlib import Path
from uuid import uuid4

from app.storage import TextStorage


def test_storage_writes_and_reads_text(tmp_path: Path) -> None:
    storage = TextStorage(root_dir=tmp_path)
    storage.ensure_layout()

    raw_text_id = uuid4()
    relative_path = storage.write_raw_text(raw_text_id, "# Hello Tooth")

    assert relative_path.startswith("raw/")
    assert storage.read_text(relative_path) == "# Hello Tooth"
