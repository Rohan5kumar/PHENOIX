from __future__ import annotations

import pytest
from ml_core.swarm.swarm import LangGraphSwarmAuditor


def test_swarm_cost_gate_nominal_state() -> None:
    """
    Test that when the cost limit is high (e.g. $5.00), the Cost Gate remains NOMINAL.
    """
    auditor = LangGraphSwarmAuditor(model_id="phoenix-primary")
    features = ["transaction_amount", "velocity_1h"]
    
    results = auditor.orchestrate_swarm_audit(
        model_id="phoenix-primary",
        accuracy=0.95,
        features=features,
        max_cost_limit=5.00,
        spot_price_hr=1.17
    )
    
    assert results["cost_limit_exceeded"] is False
    assert results["cost_gate_status"] == "NOMINAL_BUDGET_STATE"
    assert results["verdict"] in ["APPROVED", "CONDITIONAL_APPROVAL"]
    assert results["remediation_cost"] > 0.0


def test_swarm_cost_gate_breached_state() -> None:
    """
    Test that when the cost limit is lower than execution projection (e.g. $0.05),
    the Cost Gate triggers BREACHED and routes verdict to NEEDS_HUMAN_APPROVAL.
    """
    auditor = LangGraphSwarmAuditor(model_id="phoenix-primary")
    features = ["transaction_amount", "velocity_1h"]
    
    results = auditor.orchestrate_swarm_audit(
        model_id="phoenix-primary",
        accuracy=0.95,
        features=features,
        max_cost_limit=0.05,
        spot_price_hr=1.17
    )
    
    assert results["cost_limit_exceeded"] is True
    assert results["cost_gate_status"] == "BREACHED_BUDGET_CEILING"
    assert results["verdict"] == "NEEDS_HUMAN_APPROVAL"
