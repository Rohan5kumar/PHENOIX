#!/usr/bin/env python3
"""Full ml-core closed loop: Sentinel drift → Alchemist → Challenger gatekeeper."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml_core.alchemist import SyntheticAlchemist
from ml_core.challenger.trainer import metrics_summary, train_with_gatekeeper
from ml_core.pipeline_signals import PipelineSignal
from ml_core.sentinel import DriftReport, HealthPipeline
from ml_core.sentinel.inference_buffer import FEATURE_COLUMNS

_DRIFT_KEYS = (
    "drift_detected",
    "drifted_features",
    "drift_scores",
    "drifted_column_count",
    "drifted_column_share",
)


def main() -> int:
    pipeline = HealthPipeline(seed=42)
    metrics: dict[str, object] = {}

    for _ in range(20):
        metrics = pipeline.step()
        if metrics.get("drift_detected"):
            break

    if not metrics.get("drift_detected"):
        print("No drift detected.", file=sys.stderr)
        return 1

    reference = pipeline.stream._reference[list(FEATURE_COLUMNS)]
    drift = {k: metrics[k] for k in _DRIFT_KEYS if k in metrics}
    report = DriftReport.from_drift_dict(
        drift, reference, feature_columns=list(FEATURE_COLUMNS)
    )

    print("=== Alchemist ===")
    alchemist = SyntheticAlchemist.from_drift_report(report)
    alchemy = alchemist.generate_data_batch(count=5000)
    print(f"Synthetic batch: {alchemy.path}")
    print(f"Diversity: {alchemy.diversity_score:.2%} | Bias: {alchemy.bias_check_result}")
    print(f"Signal: {alchemy.signal.value}")

    if alchemy.signal != PipelineSignal.READY_FOR_RETRAINING:
        return 1

    print("\n=== Challenger Lab ===")
    model_path, challenger_signal, result = train_with_gatekeeper(alchemy.path, epochs=8)
    summary = metrics_summary(result)
    print(f"Baseline F1: {summary['baseline_f1']:.4f}")
    print(f"Challenger F1: {summary['challenger_f1']:.4f}")

    if challenger_signal == PipelineSignal.CHALLENGER_READY and model_path:
        print(f"Challenger model: {model_path}")
        print(f"Signal: {challenger_signal.value}")
        return 0

    print("Challenger not promoted.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
