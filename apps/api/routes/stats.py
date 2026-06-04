from typing import Any
from fastapi import APIRouter
from routes.governance import _alchemist_log

from schemas import ModelHealthStatus

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=ModelHealthStatus)
async def stats_summary() -> ModelHealthStatus:
    return ModelHealthStatus.from_accuracy(0.92, drift_detected=False)


@router.get("/finops")
def finops_monitor() -> dict[str, Any]:
    """Calculate the estimated USD cost of a healing cycle vs manual."""
    # Calculate latest cycle cost from Alchemist Log
    latest_token_cost = 0.0
    if _alchemist_log:
        latest_token_cost = float(_alchemist_log[-1].get("estimated_cost", 0.0))
        
    # Assume 15 mins of A100 training at $4.00/hr = $1.00
    gpu_cost = 1.00
    
    total_cost_per_heal = latest_token_cost + gpu_cost
    
    # Assume manual engineering time costs ~$5,000 / month, and MTTR is 3 weeks.
    # Autonomous healing MTTR is 15 mins.
    manual_cost_per_heal = 3750.0 # ~$3750 for 3 weeks of engineer time
    
    return {
        "cost_per_heal": round(total_cost_per_heal, 4),
        "token_cost": round(latest_token_cost, 4),
        "gpu_cost": gpu_cost,
        "manual_cost": manual_cost_per_heal,
        "savings_per_heal": round(manual_cost_per_heal - total_cost_per_heal, 2),
        "projected_monthly_savings": manual_cost_per_heal * 4 # Assuming 4 drifts per month
    }
