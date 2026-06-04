#!/usr/bin/env python3
"""Run Sentinel drift detection then Alchemist synthetic balancing (local demo)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml_core.alchemist import PipelineSignal, SyntheticAlchemist
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
        print("No drift detected after 20 ticks; try increasing pipeline ticks.", file=sys.stderr)
        return 1

    reference = pipeline.stream._reference[list(FEATURE_COLUMNS)]
    drift = {k: metrics[k] for k in _DRIFT_KEYS if k in metrics}
    report = DriftReport.from_drift_dict(
        drift,
        reference,
        feature_columns=list(FEATURE_COLUMNS),
    )

    alchemist = SyntheticAlchemist.from_drift_report(report)
    result = alchemist.generate_data_batch(count=5000)

    print(f"Drift detected on: {report.drifted_features}")
    print(f"Synthetic batch: {result.path}")
    print(f"Diversity score: {result.diversity_score:.2%}")
    print(f"Bias check: {result.bias_check_result}")
    print(f"Signal: {result.signal.value}")
    return 0 if result.signal == PipelineSignal.READY_FOR_RETRAINING else 1


if __name__ == "__main__":
    raise SystemExit(main())
