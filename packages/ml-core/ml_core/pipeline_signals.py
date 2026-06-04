"""Closed-loop pipeline events (Alchemist → Challenger → Deploy)."""

from __future__ import annotations

from enum import Enum


class PipelineSignal(str, Enum):
    READY_FOR_RETRAINING = "READY_FOR_RETRAINING"
    CHALLENGER_READY = "CHALLENGER_READY"
