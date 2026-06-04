# Project Phoenix

Autonomous MLOps platform monorepo — Next.js dashboard, FastAPI orchestrator, and shared ML core (Evidently drift sentinel, synthetic data alchemist, Ray/PyTorch challenger stubs).

## Structure

```
├── apps/
│   ├── dashboard/     # Next.js observability UI
│   └── api/           # FastAPI brain + WebSocket health stream
├── packages/
│   ├── ml-core/       # sentinel, alchemist, challenger
│   └── shared-types/  # TS + Pydantic schemas
├── infra/             # K8s, Istio canary, Dockerfiles
├── pyproject.toml     # uv workspace (Python)
└── package.json       # pnpm workspaces (TypeScript)
```

## Quick start

### Python (uv)

```bash
uv sync
uv run --directory apps/api uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Dashboard (pnpm)

```bash
pnpm install
pnpm dev:dashboard
```

Open [http://localhost:3000](http://localhost:3000). The Live Accuracy chart connects to `ws://localhost:8000/ws/health`.

## API highlights

- `GET /health` — liveness
- `GET /stats/summary` — `ModelHealthStatus` snapshot
- `WS /ws/health` — mock telemetry every 2s (integrates `ml_core.sentinel.detect_drift`)

## Drift sentinel

```python
from ml_core.sentinel import detect_drift
import pandas as pd

result = detect_drift(reference_df, current_df)
# {"drift_detected": bool, "drifted_features": [...], "drift_scores": {...}}
```
