#!/usr/bin/env python3
"""Train challenger on reference + Alchemist synthetic batch; run gatekeeper."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml_core.challenger.trainer import metrics_summary, train_with_gatekeeper
from ml_core.pipeline_signals import PipelineSignal


def main() -> int:
    try:
        path, signal, result = train_with_gatekeeper(epochs=8, num_workers=1)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        print("Run: uv run python scripts/run_alchemist.py", file=sys.stderr)
        return 1

    summary = metrics_summary(result)
    print(f"Baseline golden F1: {summary['baseline_f1']:.4f}")
    print(f"Challenger golden F1: {summary['challenger_f1']:.4f}")
    print(f"Promoted: {summary['promoted']}")

    if signal == PipelineSignal.CHALLENGER_READY and path is not None:
        print(f"Challenger model: {path}")
        print("Signal: TRAINING_COMPLETE: CHALLENGER_SAVED")
        return 0

    print("Gatekeeper rejected challenger (no improvement on golden set).", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
