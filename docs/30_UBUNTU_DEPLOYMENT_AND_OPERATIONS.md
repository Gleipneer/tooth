# Ubuntu deployment and operations

This runbook is the canonical operator guide for running Tooth on a single Ubuntu host (including `aic-node` style environments).

## Operator entrypoint

- Install the CLI helper once:
  - `bash scripts/install_tooth_cli.sh`
- Then use:
  - `tooth` or `tooth start`
  - `tooth status`
  - `tooth stop`
  - `tooth restart`
  - `tooth logs`
  - `tooth doctor`
  - `tooth tui` (prints/open-target for the web operator surface)

## Startup behavior

`tooth start` performs:

1. Port preflight and conflict-aware selection for backend, frontend, and operator surfaces.
2. Backend boot:
   - ensures local PostgreSQL (`scripts/start_local_postgres.sh`)
   - ensures `backend/.venv`
   - installs backend dev requirements
   - exports default runtime DB URL (`127.0.0.1:55432`) unless `TOOTH_DATABASE_URL` is set
   - applies `alembic upgrade head`
   - starts `uvicorn`
3. Frontend boot:
   - installs frontend dependencies
   - starts Vite on the chosen host/port with backend proxy target wired.
4. Operator web surface boot:
   - starts a small status server serving `ops/operator.html` and `/api/state`.
5. Writes runtime state at `data/runtime/state.json`.

## Runtime state and truth sources

Canonical runtime state files:

- `data/runtime/state.json` - selected ports, URLs, frontend API proxy target, service PIDs, AI-runtime-configured boolean.
- `data/runtime/tooth.lock` - simple running marker.
- `data/runtime/logs/backend.log`
- `data/runtime/logs/frontend.log`
- `data/runtime/logs/operator.log`

`tooth status` uses both manifest and live checks (PID probe + HTTP health checks), and prints backend URL plus frontend API target so operators can confirm exactly which backend the UI is calling.

## Port strategy and collisions

Defaults:

- backend `8000`
- frontend `5173`
- operator `8787`

Each service uses conflict-aware fallback in a bounded local range (default + up to 20). If no free port is found, startup fails with a clear error instead of partial boot.

## Web operator surface (primary operator UX)

- Local URL is printed after `tooth start` and stored in `state.json`.
- The page shows:
  - backend/frontend/operator live status
  - worker/scheduler state (`not_configured` for current MVP)
  - selected ports and URLs
  - tailscale URLs when detectable
  - AI runtime configured boolean (never secret values)

## Tailscale behavior

When `tailscale` is installed and has an IPv4 address, Tooth includes tailscale URLs in runtime state:

- `frontend_tailscale`
- `operator_tailscale`

This avoids guesswork when accessing the UI from another tailnet node.

## Health and diagnostics

- API health: `GET /api/v1/healthz`
- Full runtime: `tooth status`
- Quick diagnostics: `tooth doctor`
- Logs: `tooth logs`

## Recovery paths

### Port conflict

- Re-run `tooth start`; if fallback range is exhausted, free one of the conflicting ports or override defaults via env.

### Half-running process

- Run `tooth stop`, then `tooth start`.
- If needed, inspect logs via `tooth logs`.

### Backend config change

- Edit `backend/.env` and restart (`tooth restart`).

## Security notes

- Never commit `backend/.env` or `frontend/.env`.
- Do not print API key values.
- `tooth doctor` only reports whether required variables are configured.

## Relationship to older ops doc

`docs/30_RELEASE_OPERATIONS.md` is retained as a compatibility pointer; this file is the canonical runbook for current Ubuntu operator flow.
