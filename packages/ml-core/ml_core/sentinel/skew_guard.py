import numpy as np
from typing import Dict, List, Any

class SkewGuard:
    def __init__(self):
        pass

    def compute_population_stability_index(self, training_ref: List[float], production_live: List[float]) -> Dict[str, Any]:
        """
        Calculates the Population Stability Index (PSI) to detect structural distribution skew.
        """
        train_arr = np.array(training_ref)
        prod_arr = np.array(production_live)
        
        if len(train_arr) == 0 or len(prod_arr) == 0:
            return {
                "psi_metric": 0.0,
                "skew_verdict": "NOMINAL",
                "action_required": False
            }
        
        # Compute distribution histograms across bounded data blocks
        train_counts, bins = np.histogram(train_arr, bins=10, density=True)
        prod_counts, _ = np.histogram(prod_arr, bins=bins, density=True)
        
        # Add tiny epsilon value to protect against divide-by-zero errors (1e-4)
        train_counts = np.where(train_counts == 0, 1e-4, train_counts)
        prod_counts = np.where(prod_counts == 0, 1e-4, prod_counts)
        
        # Core PSI Formula: sum((Actual - Expected) * ln(Actual / Expected))
        psi_value = np.sum((prod_counts - train_counts) * np.log(prod_counts / train_counts))
        
        verdict = "NOMINAL"
        if psi_value > 0.2:
            verdict = "CRITICAL_SKEW_DETECTED"
        elif psi_value > 0.1:
            verdict = "MODERATE_SKEW"
            
        return {
            "psi_metric": round(float(psi_value), 6),
            "skew_verdict": verdict,
            "action_required": True if verdict == "CRITICAL_SKEW_DETECTED" else False
        }
