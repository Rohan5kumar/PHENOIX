"""
Adversarial Outlier & concept drift injection module (Shadow Phoenix)
──────────────────────────────────────────────────────────────────
Deliberately generates feature anomalies and distributes categorical noise
to test Sentinel response rates and LangGraph swarm audit cycles.
"""

from __future__ import annotations
import numpy as np
from typing import Dict, Any, List

class ShadowTester:
    def __init__(self, baseline_mean: float = 0.0, baseline_std: float = 1.0):
        self.baseline_mean = baseline_mean
        self.baseline_std = baseline_std

    def inject_adversarial_noise(self, features: np.ndarray, severity: float = 0.5) -> np.ndarray:
        """
        Injects Gaussian white noise scaled by severity to deliberately induce feature drift.
        """
        if severity <= 0.0:
            return features
        
        noise = np.random.normal(0, self.baseline_std * severity, size=features.shape)
        return features + noise

    def generate_outliers(self, count: int, feature_dim: int, anomaly_type: str = "shatter") -> Dict[str, Any]:
        """
        Generates extreme stress-test data payloads to test your LangGraph Swarm Safety HUD.
        """
        if anomaly_type == "shatter":
            # Scale features way outside baseline dimensions
            data = np.random.normal(self.baseline_mean + 5.0, self.baseline_std * 3, size=(count, feature_dim))
            flagged_features = [f"feature_{i}" for i in range(min(feature_dim, 3))]
        else:
            # Subtle uniform shift
            data = np.random.uniform(-10.0, 10.0, size=(count, feature_dim))
            flagged_features = ["global_distribution_shift"]

        return {
            "payload": data.tolist(),
            "injected_drift": True,
            "drifted_features": flagged_features,
            "anomaly_signature": f"SIG_ADVERSARIAL_{anomaly_type.upper()}"
        }

# Alias for backwards compatibility and dynamic named imports
ShadowStressTester = ShadowTester

