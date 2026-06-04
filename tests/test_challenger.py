from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from ml_core.alchemist import SyntheticAlchemist
from ml_core.challenger import gatekeeper, train_with_gatekeeper
from ml_core.challenger.datasets import ensure_static_datasets
from ml_core.challenger.features import derive_labels, features_and_labels
from ml_core.challenger.trainer import GatekeeperResult
from ml_core.pipeline_signals import PipelineSignal
from ml_core.sentinel import DriftReport, detect_drift
from ml_core.sentinel.inference_buffer import FEATURE_COLUMNS


def test_gatekeeper_requires_two_percent_gain() -> None:
    assert gatekeeper(0.93, 0.90) is True
    assert gatekeeper(0.919, 0.90) is False
    assert gatekeeper(0.89, 0.90) is False


def test_derive_labels_binary() -> None:
    df = pd.DataFrame(
        {
            "feature_a": [0.0, 1.0, 2.0],
            "feature_b": [0.5, 0.5, 0.5],
            "feature_c": [0.5, 0.5, 0.5],
        }
    )
    y = derive_labels(df)
    assert y.shape == (3,)
    assert set(np.unique(y)).issubset({0.0, 1.0})


def test_train_with_gatekeeper_smoke(tmp_path: Path) -> None:
    pytest.importorskip("torch")

    golden = tmp_path / "golden_test.csv"
    reference = tmp_path / "reference_train.csv"
    synthetic = tmp_path / "synthetic_batch_v1.csv"

    rng = np.random.default_rng(0)
    ref = pd.DataFrame(
        {
            "feature_a": rng.normal(0, 1, 400),
            "feature_b": rng.normal(0.5, 0.3, 400),
            "feature_c": rng.uniform(0, 1, 400),
        }
    )
    ref["label"] = derive_labels(ref)
    ref.to_csv(reference, index=False)

    gold = ref.head(100).copy()
    gold.to_csv(golden, index=False)

    syn = pd.DataFrame(
        {
            "feature_a": rng.normal(0, 1, 200),
            "feature_b": rng.normal(0.5, 0.3, 200),
            "feature_c": rng.uniform(0, 1, 200),
        }
    )
    syn.to_csv(synthetic, index=False)

    import ml_core.challenger.datasets as ds
    import ml_core.challenger.trainer as trainer_mod

    old_golden = ds.GOLDEN_TEST_PATH
    old_ref = ds.REFERENCE_TRAIN_PATH
    old_base = ds.BASELINE_MODEL_PATH
    old_chal = ds.CHALLENGER_MODEL_PATH

    ds.GOLDEN_TEST_PATH = golden
    ds.REFERENCE_TRAIN_PATH = reference
    ds.BASELINE_MODEL_PATH = tmp_path / "baseline_model.pt"
    ds.CHALLENGER_MODEL_PATH = tmp_path / "challenger_model.pt"
    trainer_mod.BASELINE_MODEL_PATH = ds.BASELINE_MODEL_PATH
    trainer_mod.CHALLENGER_MODEL_PATH = ds.CHALLENGER_MODEL_PATH

    try:
        path, signal, result = train_with_gatekeeper(
            synthetic,
            epochs=3,
            baseline_epochs=3,
            smoke_test=True,
        )
        assert isinstance(result, GatekeeperResult)
        assert result.challenger_f1 >= 0.0
        assert result.baseline_f1 >= 0.0
        if result.promoted:
            assert signal == PipelineSignal.CHALLENGER_READY
            assert path is not None
            assert path.is_file()
        else:
            assert signal is None
    finally:
        ds.GOLDEN_TEST_PATH = old_golden
        ds.REFERENCE_TRAIN_PATH = old_ref
        ds.BASELINE_MODEL_PATH = old_base
        ds.CHALLENGER_MODEL_PATH = old_chal
        trainer_mod.BASELINE_MODEL_PATH = old_base
        trainer_mod.CHALLENGER_MODEL_PATH = old_chal


def test_closed_loop_alchemist_to_challenger(tmp_path: Path) -> None:
    pytest.importorskip("torch")

    ref = pd.DataFrame(
        {
            "feature_a": list(range(50)),
            "feature_b": [0.1 * i for i in range(50)],
            "feature_c": [0.5] * 50,
        }
    )
    cur = pd.DataFrame(
        {
            "feature_a": list(range(50, 100)),
            "feature_b": [0.1 * i for i in range(50)],
            "feature_c": [0.5] * 50,
        }
    )
    drift = detect_drift(ref, cur)
    report = DriftReport.from_drift_dict(drift, ref, feature_columns=list(FEATURE_COLUMNS))

    syn_path = tmp_path / "synthetic_batch_v1.csv"
    alchemist = SyntheticAlchemist(api_key=None)
    _, alchemy_signal = alchemist.generate_balancing_data(
        report, n_rows=500, output_path=syn_path
    )
    assert alchemy_signal == PipelineSignal.READY_FOR_RETRAINING

    import ml_core.challenger.datasets as ds
    import ml_core.challenger.trainer as trainer_mod

    golden = tmp_path / "golden_test.csv"
    reference = tmp_path / "reference_train.csv"
    ensure_static_datasets()
    pd.read_csv(ds.GOLDEN_TEST_PATH).to_csv(golden, index=False)
    pd.read_csv(ds.REFERENCE_TRAIN_PATH).to_csv(reference, index=False)

    old_golden = ds.GOLDEN_TEST_PATH
    old_ref = ds.REFERENCE_TRAIN_PATH
    old_base = ds.BASELINE_MODEL_PATH
    old_chal = ds.CHALLENGER_MODEL_PATH

    ds.GOLDEN_TEST_PATH = golden
    ds.REFERENCE_TRAIN_PATH = reference
    ds.BASELINE_MODEL_PATH = tmp_path / "baseline_model.pt"
    ds.CHALLENGER_MODEL_PATH = tmp_path / "challenger_model.pt"
    trainer_mod.BASELINE_MODEL_PATH = ds.BASELINE_MODEL_PATH
    trainer_mod.CHALLENGER_MODEL_PATH = ds.CHALLENGER_MODEL_PATH

    try:
        _, challenger_signal, result = train_with_gatekeeper(
            syn_path, epochs=3, smoke_test=True
        )
        assert result.promoted or challenger_signal is None
    finally:
        ds.GOLDEN_TEST_PATH = old_golden
        ds.REFERENCE_TRAIN_PATH = old_ref
        ds.BASELINE_MODEL_PATH = old_base
        ds.CHALLENGER_MODEL_PATH = old_chal
        trainer_mod.BASELINE_MODEL_PATH = old_base
        trainer_mod.CHALLENGER_MODEL_PATH = old_chal
