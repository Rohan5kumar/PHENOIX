from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_stabilize():
    response = client.get("/api/physics/stabilize")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "FIELD_STABILIZED"
    assert "stability_index" in data
    assert "tensor_output" in data
    assert "stability_index_percent" in data

def test_post_monitor():
    payload = {
        "warp_density": 0.85,
        "stability_index": 0.97
    }
    response = client.post("/api/physics/monitor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "MONITORING_ACTIVE"
    assert data["equivalent_warp_factor"] == 1.7000
    assert data["field_stability"] == 0.97
    assert "stress_energy" in data
    assert "coherence_check" in data
