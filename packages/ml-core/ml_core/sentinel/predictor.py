"""
Phoenix Sentinel — Accuracy Decay Predictor
───────────────────────────────────────────
Uses a sliding-window linear trend extrapolation (Linear Regression)
to predict accuracy drops and estimate time-to-drift.
"""

from __future__ import annotations
from typing import Any

class DriftPredictor:
    def __init__(self, threshold: float = 0.85):
        self.threshold = threshold

    def predict_decay(self, history: list[float], interval_hours: float = 1.0) -> dict[str, Any]:
        """
        Fits a simple linear trend (y = m*x + c) over history of accuracies
        to predict the slope (decay rate) and remaining hours to threshold.
        """
        if not history or len(history) < 2:
            return {
                "trend": "stable",
                "slope": 0.0,
                "remaining_hours": 999.0,
                "current_risk": "low",
                "risk_score": 0.05
            }

        # x is time intervals
        n = len(history)
        x = [float(i) for i in range(n)]
        y = history

        sum_x = sum(x)
        sum_y = sum(y)
        sum_xx = sum(i*i for i in x)
        sum_xy = sum(x[i] * y[i] for i in range(n))

        denominator = (n * sum_xx) - (sum_x * sum_x)
        if abs(denominator) < 1e-9:
            slope = 0.0
            intercept = y[-1]
        else:
            slope = ((n * sum_xy) - (sum_x * sum_y)) / denominator
            intercept = (sum_y - (slope * sum_x)) / n

        # Estimate remaining intervals
        current_val = y[-1]
        if slope >= 0:
            trend = "improving" if slope > 0.001 else "stable"
            remaining_hours = 999.0
            risk_score = max(0.01, round(1.0 - current_val, 4))
        else:
            trend = "decaying"
            diff = current_val - self.threshold
            if diff <= 0:
                remaining_hours = 0.0
                risk_score = 1.0
            else:
                remaining_hours = round(diff / abs(slope) * interval_hours, 1)
                # Risk score scales higher as remaining_hours gets smaller
                risk_score = round(min(0.99, max(0.1, 100.0 / (remaining_hours + 1.0))), 3)

        if risk_score > 0.75:
            current_risk = "critical"
        elif risk_score > 0.4:
            current_risk = "medium"
        else:
            current_risk = "low"

        return {
            "trend": trend,
            "slope": round(slope, 6),
            "remaining_hours": remaining_hours,
            "current_risk": current_risk,
            "risk_score": risk_score
        }
