"""Rolling inference batch buffer for live drift evaluation."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from ml_core.sentinel.detector import detect_drift

FEATURE_COLUMNS = ("feature_a", "feature_b", "feature_c")
LABEL_COLUMN = "label"
PREDICTION_COLUMN = "prediction"


@dataclass
class InferenceStream:
    """
    Simulates production inference batches against a fixed reference distribution.

    Each tick ingests a new batch, maintains a rolling window, and runs Evidently drift.
    """

    reference_size: int = 400
    window_size: int = 200
    batch_size: int = 32
    seed: int = 42
    _reference: pd.DataFrame = field(init=False, repr=False)
    _window: deque[dict[str, float]] = field(init=False, repr=False)
    _rng: np.random.Generator = field(init=False, repr=False)
    _drift_strength: float = field(default=0.0, init=False)

    def __post_init__(self) -> None:
        self._rng = np.random.default_rng(self.seed)
        self._window = deque(maxlen=self.window_size)
        self._reference = self._sample_batch(self.reference_size, drift=0.0)

    def _sample_batch(self, n: int, *, drift: float) -> pd.DataFrame:
        """Draw feature rows; drift shifts feature_a mean over time."""
        mean_a = 0.0 + drift * 4.0
        rows = {
            "feature_a": self._rng.normal(mean_a, 1.0, n),
            "feature_b": self._rng.normal(0.5, 0.3, n),
            "feature_c": self._rng.uniform(0.0, 1.0, n),
        }
        df = pd.DataFrame(rows)
        logits = (
            1.2 * df["feature_a"]
            + 0.8 * df["feature_b"]
            + 0.5 * df["feature_c"]
            + self._rng.normal(0, 0.2, n)
        )
        labels = (logits > logits.median()).astype(int)
        noise = self._rng.random(n) < (0.06 + drift * 0.12)
        predictions = np.where(noise, 1 - labels, labels)
        df[LABEL_COLUMN] = labels
        df[PREDICTION_COLUMN] = predictions
        return df

    def set_drift_strength(self, strength: float) -> None:
        """0 = no shift, 1 = strong covariate shift on feature_a."""
        self._drift_strength = max(0.0, min(1.0, strength))

    def ingest_batch(self) -> pd.DataFrame:
        """Simulate one inference micro-batch arriving from the serving layer."""
        batch = self._sample_batch(self.batch_size, drift=self._drift_strength)
        for row in batch.to_dict(orient="records"):
            self._window.append(row)
        return batch

    @property
    def current_window(self) -> pd.DataFrame:
        if not self._window:
            return pd.DataFrame(columns=list(FEATURE_COLUMNS))
        return pd.DataFrame(list(self._window))

    def batch_accuracy(self, batch: pd.DataFrame) -> float:
        if batch.empty or LABEL_COLUMN not in batch.columns:
            return 0.0
        correct = (batch[LABEL_COLUMN] == batch[PREDICTION_COLUMN]).mean()
        return float(correct)

    def evaluate(self) -> dict[str, object]:
        """Run sentinel on reference vs rolling inference window."""
        current = self.current_window
        if len(current) < 30:
            return {
                "drift_detected": False,
                "drifted_features": [],
                "drift_scores": {},
                "accuracy": 0.92,
                "batch_size": 0,
                "window_rows": len(current),
            }

        ref_features = self._reference[list(FEATURE_COLUMNS)]
        cur_features = current[list(FEATURE_COLUMNS)]
        drift = detect_drift(ref_features, cur_features)

        recent = current.tail(self.batch_size)
        accuracy = self.batch_accuracy(recent) if len(recent) else 0.92

        return {
            **drift,
            "accuracy": accuracy,
            "batch_size": self.batch_size,
            "window_rows": len(current),
        }
