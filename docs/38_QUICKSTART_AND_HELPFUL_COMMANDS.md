# Quickstart and helpful commands

Short operator-oriented commands for the current Tooth repo.

## Setup assumptions

- You are in repo root: `cd /home/joakim/tooth`
- `python3`, `node`, `npm`, and `curl` are installed
- PostgreSQL is available for the backend (`backend/.env` controls `DATABASE_URL`)
- `backend/.env` exists (it is copied from `.env.example` by startup scripts if missing)

## Install and run Tooth operator CLI

Install local command:

```bash
bash scripts/install_tooth_cli.sh
```

Core lifecycle:

```bash
tooth start
tooth status
tooth logs
tooth stop
tooth restart
tooth doctor
tooth tui
```

Notes:

- `tooth start` prints the main web UI URL and operator web URL.
- `tooth tui` currently prints the operator surface URL (web-based operator UX).

## Main web interface and operator web interface

- **Main web UI:** URL printed by `tooth start` as `Frontend: ...`
- **Operator web UI:** URL printed by `tooth start` as `Operator: ...`
- Operator page also shows tailscale URLs when detectable.
- In the main web UI, use **Sign up** to create a new email/password account, then sign in.

## Typical daily usage

```bash
tooth start
tooth status
tooth logs
tooth stop
```

Use `tooth restart` after changing `backend/.env` or when services need a clean restart.

## Where to find the web URLs after `tooth start`

- In terminal output from `tooth start`:
  - `Frontend: http://...`
  - `Operator: http://...`
- Later, use:

```bash
tooth status
```

`tooth status` shows frontend/operator URLs and current live health.

## What to check first if something looks wrong

1. `tooth status` (PID + health summary)
2. `tooth logs` (backend/frontend/operator logs)
3. `tooth doctor` (runtime/tooling/env checks)

## Useful development commands

Run backend dev server only:

```bash
bash scripts/dev_backend.sh
```

Run frontend dev server only:

```bash
bash scripts/dev_frontend.sh
```

Backend checks:

```bash
cd backend
/home/joakim/tooth/.venv/bin/ruff check app tests
/home/joakim/tooth/.venv/bin/pytest -q
```

Frontend checks:

```bash
cd frontend
npm test -- --run
npm run build
```

Gate scripts:

```bash
bash scripts/gate6_book_proof.sh
bash scripts/gate7_ops_proof.sh
```

## Helpful troubleshooting

### If Tooth does not start

```bash
tooth doctor
tooth logs
tooth status
```

Then check backend env and database connectivity:

```bash
ls backend/.env
```

### If ports are occupied

Tooth already tries nearby fallback ports. Re-check chosen ports:

```bash
tooth status
```

If needed, set different defaults for one run:

```bash
TOOTH_BACKEND_PORT_DEFAULT=8100 TOOTH_FRONTEND_PORT_DEFAULT=5180 TOOTH_OPERATOR_PORT_DEFAULT=8790 tooth start
```

### If AI is not working

Check configuration status (without exposing secret values):

```bash
tooth doctor
```

`OPENAI_API_KEY configured (value hidden): yes` must be present for AI/search semantic paths.

### If the web UI cannot be reached

Check process and health state:

```bash
tooth status
```

Check backend health endpoint from the shown backend URL:

```bash
curl -fsS http://127.0.0.1:8000/api/v1/healthz
```

If Tooth selected a different backend port, use that port from `tooth status`.