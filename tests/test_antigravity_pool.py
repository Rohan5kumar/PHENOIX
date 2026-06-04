from __future__ import annotations

import pytest
import asyncio
from ml_core.antigravity.tensor import EinsteinTensorSolver, PersistentQuantumTensorPool


def test_high_res_mesh_dimensions() -> None:
    """
    Asserts that the upgraded high-resolution solver produces exactly a 40x40 mesh.
    """
    solver = EinsteinTensorSolver()
    mesh = solver.compute_high_res_mesh(
        warp_factor=1.5,
        expansion_rate=0.8,
        grid_rows=40,
        grid_cols=40
    )
    
    assert len(mesh) == 40
    assert len(mesh[0]) == 40
    
    # Assert values are rounded to 5 decimal places as required
    val = mesh[20][20]
    assert isinstance(val, float)
    assert round(val, 5) == val


def test_multiprocessing_workload_isolation() -> None:
    """
    Verifies that solver objects can be successfully instantiated and executed
    independently across process boundaries (ensures no un-picklable attributes).
    """
    from concurrent.futures import ProcessPoolExecutor
    
    with ProcessPoolExecutor(max_workers=2) as executor:
        future = executor.submit(
            _execute_solver,
            1.2,
            0.6
        )
        mesh = future.result(timeout=5)
        
    assert len(mesh) == 40
    assert len(mesh[0]) == 40


def _execute_solver(w: float, e: float) -> list[list[float]]:
    solver = EinsteinTensorSolver()
    return solver.compute_high_res_mesh(w, e, 40, 40)


@pytest.mark.asyncio
async def test_persistent_quantum_tensor_pool_singleton_and_async() -> None:
    """
    Verifies that PersistentQuantumTensorPool behaves as a singleton
    and computes the grid curvature asynchronously using process executors.
    """
    pool1 = PersistentQuantumTensorPool(max_workers=2)
    pool2 = PersistentQuantumTensorPool(max_workers=2)
    
    # Assert strict singleton behavior
    assert pool1 is pool2
    
    # Compute mesh asynchronously
    mesh = await pool1.compute_mesh_async(
        warp_factor=1.2,
        expansion_rate=0.6,
        grid_rows=40,
        grid_cols=40
    )
    
    assert len(mesh) == 40
    assert len(mesh[0]) == 40
    
    # Clean shutdown
    pool1.shutdown()
