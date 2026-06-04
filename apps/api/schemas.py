"""Shared API schemas (mirrors packages/shared-types)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class HealthState(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"


class ModelHealthStatus(BaseModel):
    """Global model health payload streamed to the dashboard."""

    model_id: str = Field(default="phoenix-primary")
    accuracy: float = Field(ge=0.0, le=1.0, description="Live accuracy 0–1")
    drift_detected: bool = False
    drifted_features: list[str] = Field(default_factory=list)
    state: HealthState = HealthState.HEALTHY
    pipeline_signal: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def from_accuracy(
        cls,
        accuracy: float,
        *,
        drift_detected: bool = False,
        drifted_features: list[str] | None = None,
    ) -> ModelHealthStatus:
        features = drifted_features or []
        if accuracy < 0.75 or drift_detected:
            state = HealthState.CRITICAL
        elif accuracy < 0.85:
            state = HealthState.DEGRADED
        else:
            state = HealthState.HEALTHY
        return cls(
            accuracy=accuracy,
            drift_detected=drift_detected,
            drifted_features=features,
            state=state,
        )
