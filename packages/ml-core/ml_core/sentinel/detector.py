"""Statistical drift detection via Evidently AI."""

from __future__ import annotations

import re
from typing import Any

import pandas as pd
from evidently import Report
from evidently.presets import DataDriftPreset

_COLUMN_RE = re.compile(r"column=([^,\)]+)")


def _parse_column(metric_name: str) -> str | None:
    match = _COLUMN_RE.search(metric_name)
    return match.group(1) if match else None


def detect_drift(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    *,
    threshold: float = 0.05,
) -> dict[str, Any]:
    """
    Compare reference vs current feature distributions.

    Returns:
        drift_detected: True if any column exceeds the drift threshold.
        drifted_features: Column names with statistically significant shift.
        drift_scores: Per-column p-values from ValueDrift metrics.
    """
    if reference_data.empty or current_data.empty:
        raise ValueError("reference_data and current_data must be non-empty")

    common_cols = list(reference_data.columns.intersection(current_data.columns))
    if not common_cols:
        raise ValueError("No overlapping columns between reference and current data")

    ref = reference_data[common_cols].copy()
    cur = current_data[common_cols].copy()

    snapshot = Report(metrics=[DataDriftPreset()]).run(reference_data=ref, current_data=cur)
    metrics = snapshot.dict().get("metrics") or []

    drifted_features: list[str] = []
    drift_scores: dict[str, float] = {}
    drifted_count = 0.0
    drifted_share = 0.0

    for metric in metrics:
        name = str(metric.get("metric_name", ""))
        value = metric.get("value")

        if name.startswith("DriftedColumnsCount"):
            if isinstance(value, dict):
                drifted_count = float(value.get("count", 0))
                drifted_share = float(value.get("share", 0))
            continue

        if not name.startswith("ValueDrift"):
            continue

        column = _parse_column(name)
        if column is None:
            continue

        p_value = float(value) if value is not None else 1.0
        drift_scores[column] = p_value
        if p_value < threshold:
            drifted_features.append(column)

    drift_detected = drifted_share > 0 or len(drifted_features) > 0 or drifted_count > 0

    return {
        "drift_detected": drift_detected,
        "drifted_features": sorted(set(drifted_features)),
        "drift_scores": drift_scores,
        "drifted_column_count": int(drifted_count),
        "drifted_column_share": drifted_share,
    }
