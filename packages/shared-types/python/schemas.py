"""Pydantic mirrors of @phoenix/shared-types (TypeScript)."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class HealthState(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"


class ModelHealthStatus(BaseModel):
    model_id: str = "phoenix-primary"
    accuracy: float = Field(ge=0.0, le=1.0)
    drift_detected: bool = False
    drifted_features: list[str] = Field(default_factory=list)
    state: HealthState = HealthState.HEALTHY
    timestamp: datetime = Field(default_factory=datetime.utcnow)
