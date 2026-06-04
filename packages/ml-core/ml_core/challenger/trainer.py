"""Challenger Lab: train on reference + synthetic data, gatekeeper vs golden set."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from ml_core.challenger.datasets import (
    BASELINE_MODEL_PATH,
    CHALLENGER_MODEL_PATH,
    load_combined_training,
    load_golden_test,
    load_reference_train,
)
from ml_core.challenger.train import evaluate_checkpoint, train_on_arrays
from ml_core.pipeline_signals import PipelineSignal

GATEKEEPER_MIN_GAIN = 0.01  # 1% gain in F1-score


@dataclass
class GatekeeperResult:
    """Outcome of challenger vs baseline on the golden test set."""

    promoted: bool
    challenger_f1: float
    baseline_f1: float
    train_metrics: dict[str, float]


def gatekeeper(challenger_f1: float, baseline_f1: float) -> bool:
    """Promote when challenger F1-score is better than baseline by at least 2% absolute."""
    return (challenger_f1 - baseline_f1) >= 0.02


def notify_challenger_ready(
    *,
    challenger_f1: float,
    baseline_f1: float,
    model_path: str,
) -> None:
    """Webhook: notify Phoenix API that challenger passed gatekeeper."""
    import os

    base = os.environ.get("PHOENIX_API_URL", "http://127.0.0.1:8000").rstrip("/")
    try:
        import httpx

        httpx.post(
            f"{base}/governance/pipeline-event",
            json={
                "signal": "TRAINING_COMPLETE: CHALLENGER_SAVED",
                "challenger_f1": challenger_f1,
                "baseline_f1": baseline_f1,
                "model_path": model_path,
            },
            timeout=5.0,
        )
    except Exception:
        pass


def ensure_baseline_model(*, epochs: int = 8, force: bool = False) -> float:
    """Train and persist baseline on reference data if missing; return golden accuracy."""
    x_gold, y_gold = load_golden_test()
    if BASELINE_MODEL_PATH.is_file() and not force:
        return evaluate_checkpoint(BASELINE_MODEL_PATH, x_gold, y_gold)

    x_ref, y_ref = load_reference_train()
    train_on_arrays(
        x_ref,
        y_ref,
        epochs=epochs,
        num_workers=1,
        model_out_path=BASELINE_MODEL_PATH,
    )
    return evaluate_checkpoint(BASELINE_MODEL_PATH, x_gold, y_gold)


def train_with_gatekeeper(
    synthetic_path: Path | None = None,
    *,
    epochs: int = 8,
    num_workers: int = 1,
    baseline_epochs: int = 8,
    smoke_test: bool = False,
) -> tuple[Path | None, PipelineSignal | None, GatekeeperResult]:
    """
    Train challenger on reference + Alchemist synthetic data; promote if gatekeeper passes.

    Returns:
        (model_path, CHALLENGER_READY or None, gatekeeper details)
    """
    if smoke_test:
        epochs = min(epochs, 2)
        baseline_epochs = min(baseline_epochs, 2)

    baseline_f1 = ensure_baseline_model(epochs=baseline_epochs)
    x_train, y_train = load_combined_training(synthetic_path)
    x_gold, y_gold = load_golden_test()

    tmp_path = CHALLENGER_MODEL_PATH.with_suffix(".pt.tmp")
    train_metrics = train_on_arrays(
        x_train,
        y_train,
        epochs=epochs,
        num_workers=num_workers,
        model_out_path=tmp_path,
        smoke_test=smoke_test,
    )

    challenger_f1 = evaluate_checkpoint(tmp_path, x_gold, y_gold)
    promoted = gatekeeper(challenger_f1, baseline_f1)

    result = GatekeeperResult(
        promoted=promoted,
        challenger_f1=challenger_f1,
        baseline_f1=baseline_f1,
        train_metrics=train_metrics,
    )

    if not promoted:
        tmp_path.unlink(missing_ok=True)
        return None, None, result

    tmp_path.replace(CHALLENGER_MODEL_PATH)
    notify_challenger_ready(
        challenger_f1=challenger_f1,
        baseline_f1=baseline_f1,
        model_path=str(CHALLENGER_MODEL_PATH),
    )
    return CHALLENGER_MODEL_PATH, PipelineSignal.CHALLENGER_READY, result


def metrics_summary(result: GatekeeperResult) -> dict[str, Any]:
    return {
        "promoted": result.promoted,
        "challenger_f1": result.challenger_f1,
        "baseline_f1": result.baseline_f1,
        "train_f1": result.train_metrics.get("f1_score"),
        "train_loss": result.train_metrics.get("loss"),
    }
