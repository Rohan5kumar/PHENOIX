"""
Project Phoenix — FastAPI orchestrator.
Run: uv run --directory apps/api uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

API_ROOT = Path(__file__).resolve().parent
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

# Load .env early so all os.environ.get() calls pick up real values
from dotenv import load_dotenv
load_dotenv(API_ROOT / ".env")

from ml_core.challenger.train import train_challenger
from ml_core.sentinel import HealthPipeline
from routes import deployment_router, governance_router, health_router, stats_router, billing, waitlist
from routes.models import router as models_router
from routes.reports import router as reports_router
from routes.sync    import router as sync_router
from routes.swarm   import router as swarm_router
from routes.antigravity import router as antigravity_router, physics_router
from routes.governance import _pipeline_state
from schemas import ModelHealthStatus

app = FastAPI(
    title="Project Phoenix API",
    description="Autonomous MLOps orchestrator",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(stats_router)
app.include_router(deployment_router)
app.include_router(governance_router)
app.include_router(billing.router)
app.include_router(waitlist.router)
app.include_router(models_router)
app.include_router(reports_router)
app.include_router(sync_router)
app.include_router(swarm_router)
app.include_router(antigravity_router)
app.include_router(physics_router)



_pipeline = HealthPipeline(seed=42)


@app.websocket("/ws/health")
async def ws_health(websocket: WebSocket) -> None:
    """Stream live health from real inference batches + Evidently drift."""
    await websocket.accept()
    try:
        while True:
            metrics = await asyncio.to_thread(_pipeline.step)
            payload = ModelHealthStatus.from_accuracy(
                float(metrics["accuracy"]),
                drift_detected=bool(metrics["drift_detected"]),
                drifted_features=list(metrics.get("drifted_features", [])),
            )
            payload.pipeline_signal = _pipeline_state.get("signal")
            payload.timestamp = datetime.utcnow()
            await websocket.send_json(payload.model_dump(mode="json"))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return

