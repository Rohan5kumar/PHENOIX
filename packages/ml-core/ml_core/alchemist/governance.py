"""Fairness and diversity metrics for Alchemist synthetic batches."""

from __future__ import annotations

import numpy as np
import pandas as pd


def compute_diversity_score(df: pd.DataFrame, feature_columns: list[str]) -> float:
    """
    Normalized feature dispersion (0–1). Higher = more diverse synthetic coverage.
    """
    if df.empty or not feature_columns:
        return 0.0

    scores: list[float] = []
    for col in feature_columns:
        if col not in df.columns:
            continue
        series = df[col].astype(float)
        std = float(series.std())
        span = float(series.max() - series.min())
        if span < 1e-9:
            scores.append(0.0)
        else:
            scores.append(min(1.0, std / span))

    return float(np.mean(scores)) if scores else 0.0


def compute_bias_check(
    df: pd.DataFrame,
    feature_columns: list[str],
    *,
    drifted_features: list[str],
) -> str:
    """
    Lightweight parity check: drifted columns should not dominate the batch mean.

    Returns ``pass``, ``review``, or ``fail``.
    """
    if df.empty:
        return "fail"

    drifted = [c for c in drifted_features if c in df.columns]
    stable = [c for c in feature_columns if c in df.columns and c not in drifted]
    if not drifted or not stable:
        return "pass"

    drifted_spread = float(np.mean([df[c].std() for c in drifted]))
    stable_spread = float(np.mean([df[c].std() for c in stable]))
    if stable_spread < 1e-9:
        return "pass"

    ratio = drifted_spread / stable_spread
    if ratio > 3.0:
        return "fail"
    if ratio > 2.0:
        return "review"
    return "pass"
