# Project Phoenix — Start Guide

## Prerequisites

- Python >= 3.10 (with `uv` installed)
- Node.js >= 20 (with `pnpm` installed)

## Commands

| What | Directory | Command |
|------|-----------|---------|
| Backend API | `apps/api/` | `uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000` |
| Dashboard (frontend) | root | `pnpm dev:dashboard` |
| Both together | root | `pnpm dev` |
| Install API deps | `apps/api/` | `uv sync` |
| Install dashboard deps | root | `pnpm install` |
| Run alchemist | root | `uv run python scripts/run_alchemist.py` |
| Run challenger | root | `uv run python scripts/run_challenger.py` |
| Run closed loop | root | `uv run python scripts/run_closed_loop.py` |
| Run demo simulation | root | `uv run python scripts/demo_simulation.py` |
