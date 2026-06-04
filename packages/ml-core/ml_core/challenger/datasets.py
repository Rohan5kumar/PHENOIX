"""Dataset paths and loaders for Challenger training and gatekeeper evaluation."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from ml_core.alchemist.generator import DEFAULT_OUTPUT_PATH, LEGACY_OUTPUT_PATH
from ml_core.challenger.features import derive_labels, features_and_labels
from ml_core.sentinel.inference_buffer import LABEL_COLUMN

_PACKAGE_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = _PACKAGE_ROOT / "data"
GOLDEN_TEST_PATH = DATA_DIR / "golden_test.csv"
REFERENCE_TRAIN_PATH = DATA_DIR / "reference_train.csv"
BASELINE_MODEL_PATH = DATA_DIR / "baseline_model.pt"
CHALLENGER_MODEL_PATH = DATA_DIR / "challenger_v1.pt"
LEGACY_CHALLENGER_MODEL_PATH = DATA_DIR / "challenger_model.pt"


def resolve_synthetic_path(path: Path | None = None) -> Path:
    if path is not None:
        return path
    if DEFAULT_OUTPUT_PATH.is_file():
        return DEFAULT_OUTPUT_PATH
    if LEGACY_OUTPUT_PATH.is_file():
        return LEGACY_OUTPUT_PATH
    return DEFAULT_OUTPUT_PATH


def _generate_reference_frame(n: int, *, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    df = pd.DataFrame(
        {
            "feature_a": rng.normal(0.0, 1.0, n),
            "feature_b": rng.normal(0.5, 0.3, n),
            "feature_c": rng.uniform(0.0, 1.0, n),
        }
    )
    df[LABEL_COLUMN] = derive_labels(df)
    return df


def ensure_static_datasets(
    *,
    golden_rows: int = 500,
    reference_rows: int = 2000,
    seed: int = 999,
) -> tuple[Path, Path]:
    """Create golden test and reference training CSVs if absent."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not GOLDEN_TEST_PATH.is_file():
        _generate_reference_frame(golden_rows, seed=seed).to_csv(GOLDEN_TEST_PATH, index=False)
    if not REFERENCE_TRAIN_PATH.is_file():
        _generate_reference_frame(reference_rows, seed=seed + 1).to_csv(
            REFERENCE_TRAIN_PATH, index=False
        )
    return GOLDEN_TEST_PATH, REFERENCE_TRAIN_PATH


def load_golden_test() -> tuple[np.ndarray, np.ndarray]:
    ensure_static_datasets()
    df = pd.read_csv(GOLDEN_TEST_PATH)
    return features_and_labels(df)


def load_reference_train() -> tuple[np.ndarray, np.ndarray]:
    ensure_static_datasets()
    df = pd.read_csv(REFERENCE_TRAIN_PATH)
    return features_and_labels(df)


def load_synthetic_batch(path: Path | None = None) -> tuple[np.ndarray, np.ndarray]:
    csv_path = resolve_synthetic_path(path)
    if not csv_path.is_file():
        raise FileNotFoundError(
            f"Synthetic batch not found at {csv_path}; run Alchemist or scripts/run_alchemist.py first"
        )
    df = pd.read_csv(csv_path)
    return features_and_labels(df)


def load_combined_training(
    synthetic_path: Path | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """Original reference data plus Alchemist synthetic balancing batch."""
    x_ref, y_ref = load_reference_train()
    x_syn, y_syn = load_synthetic_batch(synthetic_path)
    x = np.vstack([x_ref, x_syn]).astype(np.float32)
    y = np.concatenate([y_ref, y_syn]).astype(np.float32)
    return x, y
