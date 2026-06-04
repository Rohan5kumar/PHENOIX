from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml_core.safeguard.monitor import check_canary_health
from celery_app import run_training_task
from celery.result import AsyncResult

router = APIRouter(prefix="/deploy", tags=["deployment"])

_current_task_id: str | None = None
_last_result: dict[str, Any] | None = None


class TrainRequest(BaseModel):
    epochs: int = Field(default=5, ge=1, le=50)
    num_workers: int = Field(default=2, ge=1, le=8)


class TrainResponse(BaseModel):
    status: str
    metrics: dict[str, Any] | None = None


@router.post("/challenger", response_model=TrainResponse)
async def deploy_challenger(
    body: TrainRequest,
) -> TrainResponse:
    """Kick off Ray Train challenger retraining (async background celery job)."""
    global _current_task_id
    if _current_task_id:
        res = AsyncResult(_current_task_id)
        if not res.ready():
            return TrainResponse(status="training_in_progress", metrics=_last_result)

    task = run_training_task.delay(body.epochs, body.num_workers)
    _current_task_id = task.id
    return TrainResponse(status="started", metrics=_last_result)


@router.get("/challenger/status", response_model=TrainResponse)
async def challenger_status() -> TrainResponse:
    global _current_task_id, _last_result
    if _current_task_id:
        res = AsyncResult(_current_task_id)
        if not res.ready():
            return TrainResponse(status="training_in_progress", metrics=_last_result)
        else:
            if res.successful():
                _last_result = res.result
            _current_task_id = None
            
    if _last_result is None:
        raise HTTPException(status_code=404, detail="No training run yet")
    return TrainResponse(status="idle", metrics=_last_result)


@router.post("/promote-challenger")
async def promote_challenger() -> dict[str, Any]:
    """
    Promote challenger to 100% traffic.
    In a real K8s env, this would patch the Istio VirtualService.
    """
    # Mocking the promotion for 10 minutes stability check
    # In practice, this would trigger a temporal workflow or a background check
    return {
        "status": "promotion_initiated",
        "target": "phoenix-challenger",
        "weight": 100,
        "message": "Shifting 100% traffic to challenger after 10m stability check."
    }


@router.get("/challenger/safeguard")
def get_safeguard_status():
    """Expose Stability Guard vitals."""
    return check_canary_health()
