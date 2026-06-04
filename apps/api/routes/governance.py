from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime
from typing import Any
from ml_core.governance.passport import list_passports, generate_model_passport

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import os
from .billing import is_auto_heal_locked

router = APIRouter(prefix="/governance", tags=["governance"])

_alchemist_log: deque[dict[str, Any]] = deque(maxlen=50)
_pipeline_state: dict[str, Any] = {
    "signal": None,
    "challenger_f1": None,
    "baseline_f1": None,
    "model_path": None,
    "updated_at": None,
}


class AlchemistActionIn(BaseModel):
    diversity_score: float = Field(ge=0.0, le=1.0)
    bias_check_result: str
    drifted_features: list[str] = Field(default_factory=list)
    row_count: int = Field(ge=0)
    batch_path: str = ""
    estimated_cost: float = 0.0


class AlchemistActionOut(AlchemistActionIn):
    timestamp: datetime


class PipelineEventIn(BaseModel):
    signal: str
    challenger_f1: float | None = None
    baseline_f1: float | None = None
    model_path: str | None = None


@router.post("/alchemist-actions", response_model=AlchemistActionOut)
def record_alchemist_action(body: AlchemistActionIn) -> AlchemistActionOut:
    if is_auto_heal_locked():
        raise HTTPException(status_code=402, detail="Payment Required: Auto-Heal is locked. Please upgrade to Pro.")
        
    entry = AlchemistActionOut(
        **body.model_dump(),
        timestamp=datetime.utcnow(),
    )
    _alchemist_log.append(entry.model_dump(mode="json"))
    return entry


@router.get("/alchemist-actions", response_model=list[AlchemistActionOut])
def list_alchemist_actions(limit: int = 20) -> list[AlchemistActionOut]:
    items = list(_alchemist_log)[-limit:]
    return [AlchemistActionOut.model_validate(item) for item in reversed(items)]


@router.post("/pipeline-event")
def record_pipeline_event(body: PipelineEventIn) -> dict[str, Any]:
    global _pipeline_state
    _pipeline_state = {
        **body.model_dump(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    return _pipeline_state


@router.get("/pipeline-status")
def pipeline_status() -> dict[str, Any]:
    return _pipeline_state


@router.get("/passports")
def get_passports():
    """List historical Model Health Passports."""
    return list_passports()


@router.post("/generate-passport")
def trigger_passport_generation(body: dict[str, Any]):
    """Manually trigger passport generation (TRL-9 audit)."""
    # In a real scenario, we'd fetch the latest records from the DB/deque
    # For now, we use the provided body or mock it
    path = generate_model_passport(
        model_id=body.get("model_id", "phoenix-challenger-v1"),
        drift_report={"drifted_features": body.get("drifted_features", [])},
        alchemist_record={
            "diversity_score": 0.88,
            "bias_check_result": "pass",
            "estimated_cost": 0.12
        },
        challenger_metrics={"challenger_f1": 0.98, "improvement": 0.038}
    )
    return {"status": "success", "passport_path": str(path)}


@router.get("/export-audit")
def export_audit_pdf(model_id: str = "phoenix-challenger-v1") -> FileResponse:
    """Compile all logs for a specific model into a PDF Compliance Report."""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    # Ensure export directory exists
    export_dir = "data/exports"
    os.makedirs(export_dir, exist_ok=True)
    pdf_path = f"{export_dir}/{model_id}_audit_trail.pdf"
    
    # Generate the PDF
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"Project Phoenix Compliance Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"Model ID: {model_id}")
    c.drawString(50, height - 90, f"Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 130, "Recent Alchemist Actions")
    
    c.setFont("Helvetica", 10)
    y = height - 150
    for action in reversed(_alchemist_log):
        if y < 100:
            c.showPage()
            c.setFont("Helvetica", 10)
            y = height - 50
        
        row_text = (f"Time: {action['timestamp'][:19]} | Diversity: {action['diversity_score']:.2f} | "
                    f"Bias: {action['bias_check_result']} | Cost: ${action['estimated_cost']:.2f}")
        c.drawString(50, y, row_text)
        y -= 20
        
    c.setFont("Helvetica-Bold", 14)
    y -= 20
    c.drawString(50, y, "Pipeline Status Summary")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Signal: {_pipeline_state.get('signal')}")
    y -= 15
    c.drawString(50, y, f"Baseline F1: {_pipeline_state.get('baseline_f1')}")
    y -= 15
    c.drawString(50, y, f"Challenger F1: {_pipeline_state.get('challenger_f1')}")
    
    c.save()
    
    return FileResponse(
        path=pdf_path, 
        filename=f"{model_id}_audit_trail.pdf", 
        media_type="application/pdf"
    )


# ──────────────────────────────────────────────
# Weights Canary Surgeon: Traffic Shift Engine
# ──────────────────────────────────────────────
from fastapi import BackgroundTasks

# In-memory cluster orchestration matrix tracking active traffic split weights
SURGEON_CLUSTER_STATE = {
    "cluster_id": "phoenix-core-mesh",
    "primary_node": "phoenix-primary",
    "challenger_node": "phoenix-challenger",
    "primary_weight": 100.0,
    "challenger_weight": 0.0,
    "deployment_status": "STABLE", # STABLE | SHIFTING | ROLLBACK_TRIGGERED
}

class ShiftRequest(BaseModel):
    target_step_duration_ms: int = 2000
    target_challenger_weight: float

async def execute_canary_shift_sequence(step_duration: int, target_weight: float):
    """
    Asynchronous state machine that simulates step-wise traffic routing execution.
    Fires real-time status shifts down the pipeline.
    """
    global SURGEON_CLUSTER_STATE
    SURGEON_CLUSTER_STATE["deployment_status"] = "SHIFTING"
    
    current_challenger = SURGEON_CLUSTER_STATE["challenger_weight"]
    steps = [10.0, 25.0, 50.0, 75.0, 100.0]
    
    for step in steps:
        if step > target_weight:
            break
            
        # Simulating active traffic shifting logic
        SURGEON_CLUSTER_STATE["challenger_weight"] = step
        SURGEON_CLUSTER_STATE["primary_weight"] = 100.0 - step
        
        # Simulated Real-time anomaly interception during shift phase
        # If accuracy cascades during canary rollout, trigger emergency structural rollback!
        simulated_live_accuracy = 0.94 if step < 50 else 0.78 # Force fake drop on high load
        
        if simulated_live_accuracy < 0.85: # Threshold limit breached!
            SURGEON_CLUSTER_STATE["deployment_status"] = "ROLLBACK_TRIGGERED"
            SURGEON_CLUSTER_STATE["primary_weight"] = 100.0
            SURGEON_CLUSTER_STATE["challenger_weight"] = 0.0
            print("// SURGEON_ALERT: Canary accuracy drop detected! Emergency rollback executed.")
            return
            
        await asyncio.sleep(step_duration / 1000.0)

    SURGEON_CLUSTER_STATE["deployment_status"] = "STABLE"

@router.get("/cluster-state")
async def get_cluster_routing_telemetry():
    """Returns the precise model split allocation state matrix"""
    return SURGEON_CLUSTER_STATE

@router.post("/trigger-rollout")
async def trigger_canary_promotion(payload: ShiftRequest, background_tasks: BackgroundTasks):
    """
    Spins up a background worker thread to execute canary stepping without blocking requests
    """
    global SURGEON_CLUSTER_STATE
    if SURGEON_CLUSTER_STATE["deployment_status"] == "SHIFTING":
        raise HTTPException(status_code=400, detail="Deployment manager is currently executing a pipeline shift.")
        
    background_tasks.add_task(
        execute_canary_shift_sequence, 
        payload.target_step_duration_ms, 
        payload.target_challenger_weight
    )
    return {"status": "PROMOTION_SEQUENCE_INITIALIZED", "cluster": "phoenix-core-mesh"}

