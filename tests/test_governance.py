from __future__ import annotations

import pandas as pd

from ml_core.alchemist.governance import compute_bias_check, compute_diversity_score


def test_diversity_score_range() -> None:
    df = pd.DataFrame(
        {"feature_a": [0.0, 1.0, 2.0], "feature_b": [0.5, 0.5, 0.5]}
    )
    score = compute_diversity_score(df, ["feature_a", "feature_b"])
    assert 0.0 <= score <= 1.0


def test_bias_check_pass() -> None:
    df = pd.DataFrame(
        {
            "feature_a": [0.1, 0.2, 0.3],
            "feature_b": [0.5, 0.6, 0.7],
        }
    )
    assert compute_bias_check(df, ["feature_a", "feature_b"], drifted_features=["feature_a"]) == "pass"
