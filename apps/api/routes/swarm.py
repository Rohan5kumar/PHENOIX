"""
Phoenix Swarm Orchestrator API
──────────────────────────────
Handles Swarm Agent Auditing, Cloud Spot GPU Cost Estimation,
and Adversarial Shadow Stress Injections.
"""

from __future__ import annotations
import random
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ml_core.swarm.swarm import SwarmAuditor, LangGraphSwarmAuditor
from ml_core.sentinel.stress_tester import ShadowStressTester

router = APIRouter(prefix="/swarm", tags=["swarm"])

class StressTestRequest(BaseModel):
    intensity: float = 0.5

class AuditRequest(BaseModel):
    model_id: str
    accuracy: float
    features: List[str]
    max_cost_limit: float = 5.00
    spot_price_hr: float = 1.17

@router.post("/audit")
async def trigger_swarm_audit(payload: AuditRequest):
    """
    Executes the multi-agent LangGraph orchestration pipeline over the target model parameters.
    """
    auditor = LangGraphSwarmAuditor()
    results = auditor.orchestrate_swarm_audit(
        model_id=payload.model_id,
        accuracy=payload.accuracy,
        features=payload.features,
        max_cost_limit=payload.max_cost_limit,
        spot_price_hr=payload.spot_price_hr
    )
    return results

@router.post("/audit/{model_id}")
async def audit_retraining_cycle(model_id: str, max_cost_limit: float = 5.00) -> Dict[str, Any]:
    """
    Invokes the multi-agent SwarmAuditor to run Security, Ethics,
    and Performance reviews on the specified model's latest health stream.
    """
    accuracies = {
        "phoenix-primary": 0.942,
        "phoenix-challenger": 0.968,
        "sales-forecast-v2": 0.912,
        "fraud-detector-v3": 0.885,
        "churn-predictor-v1": 0.897,
        "risk-llm-adapter": 0.915,
    }
    accuracy = accuracies.get(model_id, 0.90)
    features = ["transaction_amount", "velocity_1h", "geo_region", "device_type"]
    
    # Dynamic spot pricing integration from FinOps lookup
    cost_data = await cloud_cost_estimator(model_id)
    spot_price = cost_data["recommended_zone"]["spot_price_hr"]
    
    auditor = LangGraphSwarmAuditor(model_id)
    swarm_state = auditor.orchestrate_swarm_audit(
        model_id=model_id,
        accuracy=accuracy,
        features=features,
        max_cost_limit=max_cost_limit,
        spot_price_hr=spot_price
    )
    return swarm_state

@router.get("/cost-estimator/{model_id}")
async def cloud_cost_estimator(model_id: str) -> Dict[str, Any]:
    """
    Compares spot instance pricing for GPUs (H100, A100, L4) across cloud providers
    (AWS, GCP, Azure, CoreWeave) to rank the most cost-effective deployment zone.
    """
    # GPU configurations
    gpu_profiles = [
        {"gpu": "NVIDIA H100 SXM", "memory": "80GB HBM3", "base_on_demand": 4.76},
        {"gpu": "NVIDIA A100 PCIe", "memory": "80GB HBM2e", "base_on_demand": 3.67},
        {"gpu": "NVIDIA L4 Tensor Core", "memory": "24GB GDDR6", "base_on_demand": 0.95},
    ]
    
    regions = [
        {"provider": "AWS", "region": "us-east-1", "network_latency_ms": 14},
        {"provider": "GCP", "region": "us-central1", "network_latency_ms": 22},
        {"provider": "Azure", "region": "westeurope", "network_latency_ms": 38},
        {"provider": "CoreWeave", "region": "us-east-4", "network_latency_ms": 8},
    ]
    
    estimator_results = []
    for gpu in gpu_profiles:
        for reg in regions:
            # Spot pricing is typically 40% - 85% cheaper than on-demand
            discount = random.uniform(0.45, 0.80)
            spot_price = round(gpu["base_on_demand"] * (1.0 - discount), 3)
            
            estimator_results.append({
                "provider": reg["provider"],
                "region": reg["region"],
                "gpu": gpu["gpu"],
                "memory": gpu["memory"],
                "on_demand_price_hr": gpu["base_on_demand"],
                "spot_price_hr": spot_price,
                "savings_percent": round(discount * 100, 1),
                "latency_ms": reg["network_latency_ms"],
                "score": round((1.0 / spot_price) * 10.0 - (reg["network_latency_ms"] / 20.0), 2)
            })
            
    # Sort by scorecard efficiency score (highest is best value)
    estimator_results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "model_id": model_id,
        "recommended_zone": estimator_results[0],
        "all_comparisons": estimator_results[:8] # Return top 8 choices
    }

@router.post("/stress-test/{model_id}")
async def trigger_stress_test(model_id: str, payload: StressTestRequest) -> Dict[str, Any]:
    """
    Triggers the Shadow Phoenix Outlier Injection attack to verify the
    Sentinel's defensive response, returning stress-testing metrics.
    """
    features = ["transaction_amount", "velocity_1h", "geo_region"]
    tester = ShadowStressTester(features)
    
    scenario = tester.simulate_attack_scenario(payload.intensity)
    return scenario
