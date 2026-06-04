"""
Multi-Model Health Registry
────────────────────────────
Manages a registry of models and runs their health checks in parallel,
storing snapshots into Supabase `model_health_snapshots` table.

Table DDL (run once in Supabase SQL editor):
────────────────────────────────────────────
CREATE TABLE model_health_snapshots (
    id            BIGSERIAL,
    model_id      TEXT        NOT NULL,
    accuracy      FLOAT       NOT NULL,
    drift_detected BOOLEAN    DEFAULT FALSE,
    drifted_features TEXT[]   DEFAULT '{}',
    state         TEXT        NOT NULL,
    snapshot_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, model_id)
) PARTITION BY LIST (model_id);

-- Create a partition for each model:
CREATE TABLE model_health_snapshots_primary
    PARTITION OF model_health_snapshots FOR VALUES IN ('phoenix-primary');
CREATE TABLE model_health_snapshots_challenger
    PARTITION OF model_health_snapshots FOR VALUES IN ('phoenix-challenger');
CREATE TABLE model_health_snapshots_fraud_v3
    PARTITION OF model_health_snapshots FOR VALUES IN ('fraud-detector-v3');
CREATE TABLE model_health_snapshots_risk_llm
    PARTITION OF model_health_snapshots FOR VALUES IN ('risk-llm-adapter');
"""

from __future__ import annotations

import asyncio
import os
import random
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ml_core.sentinel.predictor import DriftPredictor

router = APIRouter(prefix="/models", tags=["models"])

# ──────────────────────────────────────────────
# Model Registry (source-of-truth for the UI)
# ──────────────────────────────────────────────
MODEL_REGISTRY: list[dict[str, Any]] = [
    {
        "model_id":    "phoenix-primary",
        "display_name": "Phoenix Primary",
        "description":  "Production fraud-detection model (Random Forest v2)",
        "version":      "v2.4.1",
        "status":       "production",
        "color":        "#22c55e",
        "domain":       "fraud",
    },
    {
        "model_id":    "phoenix-challenger",
        "display_name": "Phoenix Challenger",
        "description":  "Alchemist-trained challenger in canary (10% traffic)",
        "version":      "v2.5.0-rc",
        "status":       "canary",
        "color":        "#f97316",
        "domain":       "fraud",
    },
    {
        "model_id":    "sales-forecast-v2",
        "display_name": "Sales Model",
        "description":  "Revenue forecasting — XGBoost trained on CRM + transactional data",
        "version":      "v2.1.0",
        "status":       "production",
        "color":        "#06b6d4",
        "domain":       "sales",
    },
    {
        "model_id":    "fraud-detector-v3",
        "display_name": "Fraud Detection",
        "description":  "XGBoost anomaly detector — high-velocity transaction streams",
        "version":      "v3.1.0",
        "status":       "staging",
        "color":        "#8b5cf6",
        "domain":       "fraud",
    },
    {
        "model_id":    "churn-predictor-v1",
        "display_name": "Customer Churn",
        "description":  "LightGBM churn prediction — 90-day retention window",
        "version":      "v1.4.2",
        "status":       "production",
        "color":        "#ec4899",
        "domain":       "retention",
    },
    {
        "model_id":    "risk-llm-adapter",
        "display_name": "Risk LLM Adapter",
        "description":  "GPT-4o fine-tuned adapter for regulatory risk scoring",
        "version":      "v0.9.2",
        "status":       "experimental",
        "color":        "#f59e0b",
        "domain":       "risk",
    },
]

_registry_map = {m["model_id"]: m for m in MODEL_REGISTRY}

# Baseline accuracy per model
_MODEL_BASE_ACC: dict[str, float] = {
    "phoenix-primary":    0.94,
    "phoenix-challenger": 0.97,
    "sales-forecast-v2":  0.91,
    "fraud-detector-v3":  0.88,
    "churn-predictor-v1": 0.89,
    "risk-llm-adapter":   0.91,
}

# Feature sets per domain
_DOMAIN_FEATURES: dict[str, list[str]] = {
    "fraud":     ["transaction_amount", "merchant_category", "geo_region", "velocity_1h", "fraud_score_v2"],
    "sales":     ["deal_size", "lead_source", "days_in_pipeline", "rep_activity", "seasonal_index"],
    "retention": ["last_login_days", "subscription_tier", "support_tickets", "feature_usage", "nps_score"],
    "risk":      ["credit_score", "loan_to_value", "income_volatility", "sector_exposure", "liquidity_ratio"],
}



# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class ModelHealthSnapshot(BaseModel):
    model_id:         str
    display_name:     str
    accuracy:         float
    drift_detected:   bool
    drifted_features: list[str]
    state:            str
    latency_ms:       float
    snapshot_at:      datetime
    version:          str
    status:           str
    color:            str


# ──────────────────────────────────────────────
# Lazy Supabase client
# ──────────────────────────────────────────────
_supabase_client = None

def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_KEY", "")
        if url and "your-project" not in url:
            from supabase import create_client
            _supabase_client = create_client(url, key)
    return _supabase_client


# ──────────────────────────────────────────────
# Simulate health check for one model
# (In production: replace with real inference calls)
# ──────────────────────────────────────────────
async def _check_model_health(model: dict[str, Any]) -> ModelHealthSnapshot:
    """Run health check for a single model (simulated with realistic variance)."""
    await asyncio.sleep(random.uniform(0.05, 0.25))

    mid    = model["model_id"]
    domain = model.get("domain", "fraud")

    base_acc = _MODEL_BASE_ACC.get(mid, 0.90)
    accuracy = round(base_acc + random.uniform(-0.04, 0.02), 4)
    drift    = random.random() < 0.25

    all_features = _DOMAIN_FEATURES.get(domain, _DOMAIN_FEATURES["fraud"])
    drifted = random.sample(all_features, k=random.randint(1, 3)) if drift else []

    if accuracy < 0.75 or (drift and len(drifted) > 2):
        state = "critical"
    elif accuracy < 0.85 or drift:
        state = "degraded"
    else:
        state = "healthy"

    snapshot = ModelHealthSnapshot(
        model_id=mid,
        display_name=model["display_name"],
        accuracy=accuracy,
        drift_detected=drift,
        drifted_features=drifted,
        state=state,
        latency_ms=round(random.uniform(12.0, 280.0), 1),
        snapshot_at=datetime.utcnow(),
        version=model["version"],
        status=model["status"],
        color=model["color"],
    )

    try:
        db = _get_supabase()
        if db:
            db.table("model_health_snapshots").insert({
                "model_id":         snapshot.model_id,
                "accuracy":         snapshot.accuracy,
                "drift_detected":   snapshot.drift_detected,
                "drifted_features": snapshot.drifted_features,
                "state":            snapshot.state,
                "snapshot_at":      snapshot.snapshot_at.isoformat(),
            }).execute()
    except Exception:
        pass

    return snapshot


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@router.get("/registry", summary="List all registered models")
def list_models() -> list[dict[str, Any]]:
    """Return the model registry for the Model Switcher dropdown."""
    return MODEL_REGISTRY


@router.get("/{model_id}/health", response_model=ModelHealthSnapshot)
async def get_model_health(model_id: str) -> ModelHealthSnapshot:
    """Get the latest health snapshot for a single model."""
    model = _registry_map.get(model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not in registry.")
    return await _check_model_health(model)


@router.post("/health-snapshot/all", response_model=list[ModelHealthSnapshot])
async def snapshot_all_models() -> list[ModelHealthSnapshot]:
    """
    Trigger parallel health checks for ALL registered models using asyncio.gather.
    Results are simultaneously persisted to the Supabase partitioned table.
    """
    results = await asyncio.gather(
        *[_check_model_health(m) for m in MODEL_REGISTRY],
        return_exceptions=False,
    )
    return list(results)


@router.get("/health-snapshot/history/{model_id}")
async def get_snapshot_history(model_id: str, limit: int = 20) -> list[dict[str, Any]]:
    """Fetch historical snapshots from Supabase for a specific model partition."""
    if model_id not in _registry_map:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not in registry.")
    try:
        db = _get_supabase()
        if db:
            res = (
                db.table("model_health_snapshots")
                .select("*")
                .eq("model_id", model_id)
                .order("snapshot_at", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data
    except Exception:
        pass
    # Return empty list if Supabase not configured
    return []


@router.get("/{model_id}/prediction")
async def get_model_prediction(model_id: str) -> dict[str, Any]:
    """
    Retrieves historical accuracies for the model and computes the drift / risk prediction
    using DriftPredictor linear trend analysis.
    """
    if model_id not in _registry_map:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not in registry.")

    # 1. Fetch history from Supabase
    db = _get_supabase()
    history_accuracies = []
    if db:
        try:
            res = (
                db.table("model_health_snapshots")
                .select("accuracy")
                .eq("model_id", model_id)
                .order("snapshot_at", desc=True)
                .limit(10)
                .execute()
            )
            # Order chronologically (oldest first) for linear trend fitting
            history_accuracies = [row["accuracy"] for row in reversed(res.data)]
        except Exception:
            pass

    # 2. Fallback to mock sequence if no data in database yet
    if len(history_accuracies) < 2:
        base_acc = _MODEL_BASE_ACC.get(model_id, 0.90)
        # Generate a realistic decaying sequence for demonstration
        history_accuracies = [
            round(base_acc + 0.01, 4),
            round(base_acc + 0.005, 4),
            round(base_acc - 0.002, 4),
            round(base_acc - 0.008, 4),
            round(base_acc - 0.015, 4),
        ]

    # 3. Compute drift prediction
    predictor = DriftPredictor(threshold=0.85)
    pred_res = predictor.predict_decay(history_accuracies)
    pred_res["history"] = history_accuracies
    return pred_res


# Temporary mock historical database tracker for trend estimation
MODEL_HISTORY_CACHE: dict[str, list[float]] = {
    "phoenix-primary": [0.96, 0.95, 0.95, 0.94, 0.942],
    "phoenix-challenger": [0.89, 0.88, 0.87, 0.865, 0.861],
    "risk-llm-adapter": [0.82, 0.80, 0.78, 0.76, 0.742]
}

class PredictionPayload(BaseModel):
    model_id: str
    features: list[float]

@router.post("/{model_id}/predict")
async def evaluate_model_prediction(model_id: str, payload: PredictionPayload):
    if model_id not in _registry_map:
        raise HTTPException(status_code=404, detail="Target model node not recognized in registry.")
    
    history = MODEL_HISTORY_CACHE.get(model_id, [0.90, 0.89, 0.88])
    predictor = DriftPredictor(threshold=0.85)
    decay_metrics = predictor.predict_decay(history)
    
    return {
        "model_id": model_id,
        "prediction_nominal": True if decay_metrics["current_risk"] != "critical" else False,
        "telemetry": decay_metrics
    }

@router.post("/{model_id}/inject-stress")
async def trigger_pipeline_stress(model_id: str, severity: float):
    """
    Directly decreases model accuracy in the cache to trigger a drift alert on the frontend map.
    """
    if model_id not in _registry_map:
        raise HTTPException(status_code=404, detail="Target node offline.")
        
    if model_id not in MODEL_HISTORY_CACHE:
        MODEL_HISTORY_CACHE[model_id] = [0.90, 0.89, 0.88]
        
    current_val = MODEL_HISTORY_CACHE[model_id][-1]
    new_accuracy = max(0.50, current_val - (severity * 0.15))
    MODEL_HISTORY_CACHE[model_id].append(round(new_accuracy, 3))
    
    # Proactively insert a degraded snapshot in the database to synchronize live map state
    try:
        db = _get_supabase()
        if db:
            db.table("model_health_snapshots").insert({
                "model_id":         model_id,
                "accuracy":         round(new_accuracy, 3),
                "drift_detected":   True,
                "drifted_features": ["injected_adversarial_noise"],
                "state":            "critical" if new_accuracy < 0.75 else "degraded",
            }).execute()
    except Exception:
        pass
        
    return {
        "status": "STRESS_INJECTED",
        "target_node": model_id,
        "new_historical_bounds": MODEL_HISTORY_CACHE[model_id]
    }


