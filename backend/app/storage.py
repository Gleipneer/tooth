from __future__ import annotations

import os
import uuid
from pathlib import Path

from app.config import get_settings


class TextStorage:
    def __init__(self, root_dir: Path | None = None) -> None:
        settings = get_settings()
        self.root_dir = root_dir or settings.data_dir

    def ensure_layout(self) -> None:
        for directory in ("raw", "drafts", "imports"):
            (self.root_dir / directory).mkdir(parents=True, exist_ok=True)

    def write_raw_text(self, raw_text_id: uuid.UUID, content: str) -> str:
        return self._atomic_write("raw", raw_text_id, content)

    def write_draft(self, draft_id: uuid.UUID, content: str) -> str:
        return self._atomic_write("drafts", draft_id, content)

    def read_text(self, relative_path: str) -> str:
        path = self.root_dir / relative_path
        return path.read_text(encoding="utf-8")

    def _atomic_write(self, directory: str, object_id: uuid.UUID, content: str) -> str:
        target_dir = self.root_dir / directory
        target_dir.mkdir(parents=True, exist_ok=True)

        target_path = target_dir / f"{object_id}.md"
        tmp_path = target_dir / f".{object_id}.tmp"
        tmp_path.write_text(content, encoding="utf-8")
        os.replace(tmp_path, target_path)
        return str(target_path.relative_to(self.root_dir))
