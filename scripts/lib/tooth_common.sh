#!/usr/bin/env bash
set -euo pipefail

TOOTH_ROOT="${TOOTH_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TOOTH_RUNTIME_DIR="$TOOTH_ROOT/data/runtime"
TOOTH_LOG_DIR="$TOOTH_RUNTIME_DIR/logs"
TOOTH_STATE_FILE="$TOOTH_RUNTIME_DIR/state.json"
TOOTH_LOCK_FILE="$TOOTH_RUNTIME_DIR/tooth.lock"

TOOTH_BACKEND_HOST="${TOOTH_BACKEND_HOST:-127.0.0.1}"
TOOTH_BACKEND_PORT_DEFAULT="${TOOTH_BACKEND_PORT_DEFAULT:-8000}"
TOOTH_FRONTEND_HOST="${TOOTH_FRONTEND_HOST:-0.0.0.0}"
TOOTH_FRONTEND_PORT_DEFAULT="${TOOTH_FRONTEND_PORT_DEFAULT:-5173}"
TOOTH_OPERATOR_HOST="${TOOTH_OPERATOR_HOST:-0.0.0.0}"
TOOTH_OPERATOR_PORT_DEFAULT="${TOOTH_OPERATOR_PORT_DEFAULT:-8787}"

mkdir -p "$TOOTH_RUNTIME_DIR" "$TOOTH_LOG_DIR"

stderr() { printf "%s\n" "$*" >&2; }
info() { printf "%s\n" "$*"; }

port_is_busy() {
  python3 - "$1" <<'PY'
import socket, sys
port = int(sys.argv[1])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.2)
rc = s.connect_ex(("127.0.0.1", port))
s.close()
sys.exit(0 if rc == 0 else 1)
PY
}

choose_port() {
  local preferred="$1"
  local span="${2:-20}"
  local p="$preferred"
  local max=$((preferred + span))
  while [ "$p" -le "$max" ]; do
    if ! port_is_busy "$p"; then
      printf "%s" "$p"
      return 0
    fi
    p=$((p + 1))
  done
  return 1
}

http_ok() {
  local url="$1"
  curl -fsS --max-time 2 "$url" >/dev/null 2>&1
}

detect_tailscale_ip() {
  if ! command -v tailscale >/dev/null 2>&1; then
    return 1
  fi
  while IFS= read -r line; do
    line="${line//[$'\r\n\t ']}"
    if [[ "$line" == *.* ]]; then
      printf "%s\n" "$line"
      return 0
    fi
  done < <(tailscale ip -4 2>/dev/null || true)
  return 1
}

write_state() {
  local backend_pid="$1"
  local frontend_pid="$2"
  local operator_pid="$3"
  local backend_port="$4"
  local frontend_port="$5"
  local operator_port="$6"
  local tailscale_ip="${7:-}"
  python3 - "$TOOTH_STATE_FILE" "$backend_pid" "$frontend_pid" "$operator_pid" "$backend_port" "$frontend_port" "$operator_port" "$TOOTH_BACKEND_HOST" "$TOOTH_FRONTEND_HOST" "$TOOTH_OPERATOR_HOST" "$tailscale_ip" <<'PY'
import json, os, sys, time
state_file, bpid, fpid, opid, bp, fp, opp, bh, fh, oph, tail = sys.argv[1:]
backend_url = f"http://{bh}:{bp}"
frontend_url = f"http://127.0.0.1:{fp}"
operator_url = f"http://127.0.0.1:{opp}"
tailscale_frontend = f"http://{tail}:{fp}" if tail else None
tailscale_operator = f"http://{tail}:{opp}" if tail else None
env_path = os.path.join(os.path.dirname(os.path.dirname(state_file)), "..", "backend", ".env")
env_path = os.path.abspath(env_path)
ai_configured = False
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for ln in f:
            if ln.startswith("OPENAI_API_KEY=") and ln.strip().split("=", 1)[1]:
                ai_configured = True
                break
payload = {
    "started_at": int(time.time()),
    "pids": {"backend": int(bpid), "frontend": int(fpid), "operator": int(opid)},
    "ports": {"backend": int(bp), "frontend": int(fp), "operator": int(opp)},
    "hosts": {"backend": bh, "frontend": fh, "operator": oph},
    "urls": {
        "backend": backend_url,
        "frontend_api_target": backend_url,
        "frontend_local": frontend_url,
        "operator_local": operator_url,
        "frontend_tailscale": tailscale_frontend,
        "operator_tailscale": tailscale_operator,
    },
    "ai_runtime_configured": ai_configured,
}
with open(state_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)
PY
}

read_state_field() {
  local field="$1"
  python3 - "$TOOTH_STATE_FILE" "$field" <<'PY'
import json, sys
p = sys.argv[2].split(".")
with open(sys.argv[1], "r", encoding="utf-8") as f:
    node = json.load(f)
for key in p:
    node = node[key]
print(node)
PY
}

pid_alive() {
  kill -0 "$1" >/dev/null 2>&1
}

require_state() {
  if [ ! -f "$TOOTH_STATE_FILE" ]; then
    stderr "Tooth runtime state not found: $TOOTH_STATE_FILE"
    return 1
  fi
}
