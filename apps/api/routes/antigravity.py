"""
FastAPI Antigravity & Quantum Vacuum Field Stabilization Router
─────────────────────────────────────────────────────────────────
Processes real-time field coil parameters, runs PID correction loops, and
serves Einstein Stress-Energy Tensor telemetry to feed the 3D HUD grid canvas.
"""

from __future__ import annotations
import asyncio
import json
import math
import os
import random
from typing import Dict, Any, List
from concurrent.futures import ProcessPoolExecutor

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import redis

# Import swarm logs for FinOps alerts
from ml_core.swarm.swarm import SWARM_LOGS

from ml_core.antigravity.tensor import EinsteinTensorSolver, PersistentQuantumTensorPool

router = APIRouter(prefix="/antigravity", tags=["antigravity"])

# Global solver instantiation
_solver = EinsteinTensorSolver()
_tensor_pool = PersistentQuantumTensorPool()

# Persistent PID states for stabilization coils
COIL_ERROR_INTEGRAL = 0.0
LAST_COIL_ERROR = 0.0

# Initialize global ProcessPoolExecutor
executor = ProcessPoolExecutor(max_workers=4)

# Initialize global lazy Redis connection setup
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client

def _run_mesh_calculation(warp_factor: float, expansion_rate: float, grid_rows: int, grid_cols: int) -> list[list[float]]:
    """Helper method executed in sub-processes to isolate calculation workload."""
    solver = EinsteinTensorSolver()
    return solver.compute_high_res_mesh(warp_factor, expansion_rate, grid_rows, grid_cols)

class CoilTelemetryPayload(BaseModel):
    warp_factor: float
    expansion_rate: float
    coil_temperatures: List[float]
    fluctuation_index: float

class PhaseCorrectionResponse(BaseModel):
    stable: bool
    phase_correction_angle: float
    correction_verdict: str
    stabilization_latency_ns: int

@router.post("/stabilize", response_model=PhaseCorrectionResponse)
async def calculate_vacuum_stabilization(payload: CoilTelemetryPayload):
    """
    Evaluates quantum vacuum fluctuations and runs a PID controller to calculate phase corrections.
    """
    global COIL_ERROR_INTEGRAL, LAST_COIL_ERROR
    
    # 1. PID calculation variables
    target_fluctuation = 0.05
    error = payload.fluctuation_index - target_fluctuation
    
    COIL_ERROR_INTEGRAL += error
    derivative = error - LAST_COIL_ERROR
    LAST_COIL_ERROR = error
    
    # PID constants locked for space-time metrics
    Kp, Ki, Kd = 2.5, 0.4, 0.8
    correction_angle = (Kp * error) + (Ki * COIL_ERROR_INTEGRAL) + (Kd * derivative)
    
    # Limit phase angle correction to [-180, 180] degrees
    correction_angle = max(-180.0, min(180.0, correction_angle * 100.0))
    
    stable = abs(error) < 0.15
    verdict = "NOMINAL_FIELD_ALIGNMENT" if stable else "EMERGENCY_COIL_PHASE_SHIFT_REQUIRED"
    
    return {
        "stable": stable,
        "phase_correction_angle": round(correction_angle, 4),
        "correction_verdict": verdict,
        "stabilization_latency_ns": random.randint(120, 480)
    }

@router.get("/telemetry")
async def get_warp_field_telemetry(warp_factor: float = 1.0, expansion_rate: float = 0.5):
    """
    Solves the Einstein Field Equations asynchronously via a ProcessPoolExecutor pool and Redis cache.
    """
    grid_rows, grid_cols = 40, 40
    
    # 1. Attempt to fetch from high-speed Redis cache tier
    redis_client = get_redis_client()
    cache_key = f"phoenix:telemetry:mesh:{warp_factor}:{expansion_rate}:{grid_rows}:{grid_cols}"
    mesh_curvature = None
    
    if redis_client is not None:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                mesh_curvature = json.loads(cached_data)
        except Exception:
            pass
            
    # 2. Solve base metric equations
    tensor_payload = _solver.solve_energy_density(warp_factor, expansion_rate)
    
    # 3. Offload curvature geometry mesh to multiprocessing workers if not cached
    if mesh_curvature is None:
        loop = asyncio.get_running_loop()
        mesh_curvature = await loop.run_in_executor(
            executor,
            _run_mesh_calculation,
            warp_factor,
            expansion_rate,
            grid_rows,
            grid_cols
        )
        
        # Cache results with 5-minute TTL
        if redis_client is not None:
            try:
                redis_client.setex(cache_key, 300, json.dumps(mesh_curvature))
            except Exception:
                pass
        
    return {
        "warp_factor": warp_factor,
        "expansion_rate": expansion_rate,
        "stress_energy": tensor_payload,
        "power_draw_mw": round(abs(tensor_payload["tensor_T00"] * 1e-36) + random.uniform(120, 240), 2),
        "oscillation_frequency_ghz": round(14.28 + random.uniform(-0.15, 0.15), 4),
        "spacetime_curvature_mesh": mesh_curvature
    }

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    WebSocket channel to stream live coordinate adjustments and high-res spacetime curvature.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            warp_factor = float(data.get("warp_factor", 1.0))
            expansion_rate = float(data.get("expansion_rate", 0.5))
            
            telemetry = await get_warp_field_telemetry(warp_factor, expansion_rate)
            await websocket.send_json({
                "status": "TELEMETRY_STREAM",
                "telemetry": telemetry
            })
    except WebSocketDisconnect:
        pass
    except Exception:
        pass



# ──── Quantum Field Router (Block [2] - Asynchronous Field Stability Monitoring) ────

physics_router = APIRouter(prefix="/api/physics", tags=["Warp Field"])

class FieldMetrics(BaseModel):
    warp_density: float
    stability_index: float

@physics_router.get("/stabilize")
async def stabilize_field():
    """
    Simulates high-performance quantum stabilization routine.
    Calculates field tensors and provides field stability indexing.
    """
    stability = random.uniform(0.95, 0.99)
    # Perform a quick real tensor check in the background/inline
    T00 = _solver.solve_energy_density(1.0, 0.5)["tensor_T00"]
    return {
        "status": "FIELD_STABILIZED",
        "stability_index": round(stability, 6),
        "tensor_output": f"{T00:.5e}",
        "stability_index_percent": f"{stability * 100:.4f}%",
        "field_warp_factor": 1.0,
        "coherence_status": "HIGH_COHERENCE_STATE" if stability > 0.96 else "NOMINAL_COHERENCE_STATE"
    }

@physics_router.post("/monitor")
async def monitor_field_tensors(metrics: FieldMetrics):
    """
    Ingests live field metrics and returns updated stress-energy tensor profiles.
    """
    density = metrics.warp_density
    stability = metrics.stability_index
    # Map warp density into equivalent warp factor
    eq_warp_factor = density * 2.0
    tensor_payload = _solver.solve_energy_density(eq_warp_factor, 1.0 - stability)
    
    return {
        "status": "MONITORING_ACTIVE",
        "equivalent_warp_factor": round(eq_warp_factor, 4),
        "field_stability": round(stability, 6),
        "stress_energy": tensor_payload,
        "coherence_check": "METRIC_ALIGNMENT_NOMINAL" if stability > 0.85 else "COHERENCE_DRIFT_DETECTED"
    }

# New endpoint: worker status for monitoring persistent pool
@physics_router.get("/worker-status")
async def get_worker_status() -> dict:
    """Expose active workers, queue size, and average execution time for the tensor pool."""
    return _tensor_pool.get_pool_status()

# New endpoint: retrieve recent swarm finops logs
@physics_router.get("/swarm-logs")
async def get_swarm_logs(limit: int = 20) -> List[dict]:
    """Return recent finops related logs generated by the cost gatekeeper."""
    return list(SWARM_LOGS)[-limit:][::-1]
