from __future__ import annotations

from pathlib import Path
import pytest
import pandas as pd

from ml_core.alchemist import SyntheticAlchemist
from ml_core.sentinel import DriftReport


@pytest.fixture
def dummy_drift_report() -> DriftReport:
    """Fixture producing standard DriftReport parameters."""
    return DriftReport(
        drift_detected=True,
        drifted_features=["feature_a"],
        feature_columns=["feature_a", "feature_b"],
        reference_stats={
            "feature_a": {"mean": 0.5, "std": 0.1, "min": 0.0, "max": 1.0},
            "feature_b": {"mean": 10.0, "std": 2.0, "min": 0.0, "max": 20.0},
        },
        drift_scores={"feature_a": 0.08}
    )


def test_alchemist_finops_nominal_pricing(tmp_path: Path, dummy_drift_report: DriftReport) -> None:
    """
    Asserts that under typical spot instance pricing ($1.17/hr),
    synthetic generation is allowed to run seamlessly.
    """
    out = tmp_path / "finops_nominal.csv"
    alchemist = SyntheticAlchemist.from_drift_report(dummy_drift_report, api_key=None)
    
    result = alchemist.generate_data_batch(
        count=100,
        output_path=out,
        notify=False,
        spot_price_hr=1.17
    )
    
    assert result.row_count == 100
    assert out.is_file()


def test_alchemist_finops_breached_pricing(tmp_path: Path, dummy_drift_report: DriftReport) -> None:
    """
    Asserts that if spot instance pricing ($2.80/hr) exceeds the $2.50/hr budget cap,
    the alchemist pipeline raises ValueError and aborts execution immediately.
    """
    out = tmp_path / "finops_breached.csv"
    alchemist = SyntheticAlchemist.from_drift_report(dummy_drift_report, api_key=None)
    
    with pytest.raises(ValueError) as exc:
        alchemist.generate_data_batch(
            count=100,
            output_path=out,
            notify=False,
            spot_price_hr=2.80
        )
        
    assert "FinOps Violation" in str(exc.value)
    assert "exceeds budget threshold of $2.50/hr" in str(exc.value)
    assert not out.is_file()  # Ensure no file was generated or written
