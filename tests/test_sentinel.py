import pandas as pd
from ml_core.sentinel import detect_drift


def test_detect_drift_stable():
    ref = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [0.1, 0.2, 0.3, 0.4, 0.5]})
    cur = pd.DataFrame({"a": [1.1, 2.0, 2.9, 4.1, 5.0], "b": [0.1, 0.2, 0.3, 0.4, 0.5]})
    out = detect_drift(ref, cur)
    assert "drift_detected" in out
    assert "drifted_features" in out
    assert isinstance(out["drifted_features"], list)


def test_detect_drift_shift():
    ref = pd.DataFrame({"x": list(range(50))})
    cur = pd.DataFrame({"x": list(range(50, 100))})
    out = detect_drift(ref, cur)
    assert out["drift_detected"] is True
