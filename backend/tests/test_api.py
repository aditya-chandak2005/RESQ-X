import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "RESQ-X" in data["platform"]

def test_get_disasters():
    response = client.get("/api/disasters")
    assert response.status_code == 200
    disasters = response.json()
    assert len(disasters) >= 1
    assert "Chamoli" in disasters[0]["name"]

def test_get_kpis():
    response = client.get("/api/disasters/1/kpis")
    assert response.status_code == 200
    kpis = response.json()
    assert kpis["flooded_area_sqkm"] > 0
    assert kpis["isolated_settlements"] >= 1
    assert kpis["exposed_population"] > 1000

def test_get_flood_result():
    response = client.get("/api/disasters/1/flood")
    assert response.status_code == 200
    flood = response.json()
    assert len(flood["polygons"]) >= 1
    assert flood["confidence_score"] > 0.7

def test_get_settlements_and_isolation():
    response = client.get("/api/disasters/1/settlements")
    assert response.status_code == 200
    settlements = response.json()
    assert len(settlements) >= 3
    # Raini Village should be isolated
    raini = next((s for s in settlements if "Raini" in s["name"]), None)
    assert raini is not None
    assert raini["is_isolated"] is True
    assert raini["priority_score"] >= 80.0

def test_copilot_grounded_query():
    payload = {"disaster_id": 1, "query": "Which settlements are isolated?"}
    response = client.post("/api/copilot/query", json=payload)
    assert response.status_code == 200
    ans = response.json()
    assert "Raini" in ans["response"]
    assert ans["grounded_data"]["isolated_population"] > 0

def test_what_if_simulation():
    payload = {
        "disaster_id": 1,
        "scenario_type": "bridge_failure",
        "target_bridge_id": 3
    }
    response = client.post("/api/simulations", json=payload)
    assert response.status_code == 200
    sim = response.json()
    assert "difference" in sim
    assert len(sim["required_additional_resources"]) >= 1

def test_field_feedback_dynamic_reroute():
    payload = {
        "disaster_id": 1,
        "mission_id": 1,
        "report_type": "bridge_destroyed",
        "latitude": 30.4905,
        "longitude": 79.6830,
        "details": "Bridge B-17 middle span collapsed under torrential flood wave",
        "severity": "critical"
    }
    response = client.post("/api/missions/field-reports", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["applied_to_graph"] is True
    assert res["dynamic_reroute_triggered"] is True
