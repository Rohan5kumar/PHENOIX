from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from ml_core.alchemist import PipelineSignal, SyntheticAlchemist
from ml_core.alchemist.generator import DEFAULT_OUTPUT_PATH, AlchemistResult
from ml_core.sentinel import DriftReport, detect_drift
from ml_core.sentinel.inference_buffer import FEATURE_COLUMNS


@pytest.fixture
def drift_report() -> DriftReport:
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
    return DriftReport.from_drift_dict(drift, ref, feature_columns=list(FEATURE_COLUMNS))


def test_drift_report_from_drift_dict(drift_report: DriftReport) -> None:
    assert drift_report.drift_detected is True
    assert "feature_a" in drift_report.drifted_features
    assert set(drift_report.feature_columns) == set(FEATURE_COLUMNS)
    for col in FEATURE_COLUMNS:
        assert col in drift_report.reference_stats
        assert "mean" in drift_report.reference_stats[col]


def test_alchemist_fallback_generates_csv(tmp_path: Path, drift_report: DriftReport) -> None:
    out = tmp_path / "synthetic_batch_v1.csv"
    alchemist = SyntheticAlchemist(api_key=None)
    path, signal = alchemist.generate_balancing_data(
        drift_report,
        n_rows=5000,
        output_path=out,
    )

    assert path == out
    assert signal == PipelineSignal.READY_FOR_RETRAINING
    assert out.is_file()

    df = pd.read_csv(out)
    assert len(df) == 5000
    assert list(df.columns) == drift_report.feature_columns


def test_alchemist_mock_deepseek_recipe(tmp_path: Path, drift_report: DriftReport) -> None:
    recipe = {
        "feature_a": {"dist": "normal", "mean": 0.0, "std": 0.5},
        "feature_b": {"dist": "uniform", "low": 0.0, "high": 1.0},
        "feature_c": {"dist": "normal", "mean": 0.5, "std": 0.1},
    }

    out = tmp_path / "deepseek_batch.csv"
    alchemist = SyntheticAlchemist.from_drift_report(drift_report, api_key="test-key")

    structured = {
        "rows": [],
        "recipe": recipe,
        "governance": {"diversity_score": 0.8, "bias_check_result": "pass"},
    }
    with patch.object(alchemist, "_request_structured_batch", return_value=(structured, 0.001)):
        result = alchemist.generate_data_batch(count=100, output_path=out, notify=False)

    assert result.path == out
    assert result.signal == PipelineSignal.READY_FOR_RETRAINING
    assert result.bias_check_result == "pass"

    df = pd.read_csv(out)
    assert len(df) == 100
    assert df["feature_b"].min() >= -0.01
    assert df["feature_b"].max() <= 1.01


def test_alchemist_openai_client_recipe(drift_report: DriftReport) -> None:
    """Exercise DeepSeek client wiring when openai is available."""
    pytest.importorskip("openai")

    recipe_json = (
        '{"feature_a": {"dist": "normal", "mean": 0.0, "std": 0.5}, '
        '"feature_b": {"dist": "uniform", "low": 0.0, "high": 1.0}, '
        '"feature_c": {"dist": "normal", "mean": 0.5, "std": 0.1}}'
    )
    mock_message = MagicMock()
    mock_message.content = recipe_json
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    alchemist = SyntheticAlchemist.from_drift_report(drift_report, api_key="test-key")

    with patch("ml_core.alchemist.generator._OpenAI") as mock_openai_cls:
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = mock_response

        payload, estimated_cost = alchemist._request_structured_batch(50)

    mock_client.chat.completions.create.assert_called_once()
    assert "feature_a" in payload


def test_default_output_path_under_ml_core_data() -> None:
    assert DEFAULT_OUTPUT_PATH.name == "healed_batch.csv"
    assert DEFAULT_OUTPUT_PATH.parent.name == "data"


def test_generate_data_batch_returns_governance(tmp_path: Path, drift_report: DriftReport) -> None:
    out = tmp_path / "synthetic_batch.csv"
    alchemist = SyntheticAlchemist.from_drift_report(drift_report, api_key=None)
    result = alchemist.generate_data_batch(count=200, output_path=out, notify=False)
    assert isinstance(result, AlchemistResult)
    assert result.row_count == 200
    assert 0.0 <= result.diversity_score <= 1.0
    assert result.bias_check_result in ("pass", "review", "fail")
