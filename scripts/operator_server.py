#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen


def _http_ok(url: str) -> bool:
    try:
        req = Request(url, method="GET")
        with urlopen(req, timeout=2):
            return True
    except Exception:
        return False


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


class Handler(BaseHTTPRequestHandler):
    state_file: Path
    html_file: Path

    def _json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/index.html"):
            body = self.html_file.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/api/state":
            if not self.state_file.exists():
                self._json({"status": "not_running", "reason": "state_file_missing"})
                return
            with self.state_file.open("r", encoding="utf-8") as fh:
                state = json.load(fh)
            pids = state.get("pids", {})
            urls = state.get("urls", {})
            live = {
                "backend_pid_alive": _pid_alive(int(pids.get("backend", 0))),
                "frontend_pid_alive": _pid_alive(int(pids.get("frontend", 0))),
                "operator_pid_alive": _pid_alive(int(pids.get("operator", 0))),
                "backend_health_ok": _http_ok(f"{urls.get('backend', '')}/api/v1/healthz"),
                "frontend_health_ok": _http_ok(urls.get("frontend_local", "")),
            }
            state["live"] = live
            state["worker_status"] = "not_configured"
            self._json(state)
            return
        self._json({"detail": "not found"}, status=404)

    def log_message(self, *_args) -> None:  # silence noisy access log
        return


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", required=True, type=int)
    parser.add_argument("--state-file", required=True)
    parser.add_argument("--html-file", required=True)
    args = parser.parse_args()

    Handler.state_file = Path(args.state_file)
    Handler.html_file = Path(args.html_file)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
