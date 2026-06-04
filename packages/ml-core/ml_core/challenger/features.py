"""Feature schema and label derivation aligned with Sentinel inference stream."""

from __future__ import annotations

import numpy as np
import pandas as pd

from ml_core.sentinel.inference_buffer import FEATURE_COLUMNS, LABEL_COLUMN

FEATURE_DIM = len(FEATURE_COLUMNS)


def derive_labels(features: pd.DataFrame) -> np.ndarray:
    """Match InferenceStream labeling: median-split on weighted feature logits."""
    logits = (
        1.2 * features["feature_a"]
        + 0.8 * features["feature_b"]
        + 0.5 * features["feature_c"]
    )
    return (logits > logits.median()).astype(np.float32).to_numpy()


def features_and_labels(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """Extract (X, y) arrays from a frame with feature columns and optional label column."""
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing feature columns: {missing}")

    x = df[list(FEATURE_COLUMNS)].astype(np.float32).to_numpy()
    if LABEL_COLUMN in df.columns:
        y = df[LABEL_COLUMN].astype(np.float32).to_numpy()
    else:
        y = derive_labels(df)
    return x, y
