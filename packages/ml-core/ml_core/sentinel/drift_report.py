"""Structured drift report for downstream Alchemist / Challenger pipelines."""

from __future__ import annotations

from typing import Any

import pandas as pd
from pydantic import BaseModel, Field


class DriftReport(BaseModel):
    """Sentinel drift output enriched with reference distribution stats."""

    drift_detected: bool
    drifted_features: list[str] = Field(default_factory=list)
    drift_scores: dict[str, float] = Field(default_factory=dict)
    drifted_column_count: int = 0
    drifted_column_share: float = 0.0
    feature_columns: list[str] = Field(default_factory=list)
    reference_stats: dict[str, dict[str, float]] = Field(default_factory=dict)

    @classmethod
    def from_drift_dict(
        cls,
        drift: dict[str, Any],
        reference_df: pd.DataFrame,
        *,
        feature_columns: list[str] | None = None,
    ) -> DriftReport:
        """Build a report from ``detect_drift()`` output and a reference DataFrame."""
        cols = feature_columns or list(reference_df.columns)
        stats: dict[str, dict[str, float]] = {}
        for col in cols:
            if col not in reference_df.columns:
                continue
            series = reference_df[col]
            stats[col] = {
                "mean": float(series.mean()),
                "std": float(series.std()) if len(series) > 1 else 0.0,
                "min": float(series.min()),
                "max": float(series.max()),
            }

        return cls(
            drift_detected=bool(drift.get("drift_detected", False)),
            drifted_features=list(drift.get("drifted_features", [])),
            drift_scores={k: float(v) for k, v in (drift.get("drift_scores") or {}).items()},
            drifted_column_count=int(drift.get("drifted_column_count", 0)),
            drifted_column_share=float(drift.get("drifted_column_share", 0.0)),
            feature_columns=cols,
            reference_stats=stats,
        )
