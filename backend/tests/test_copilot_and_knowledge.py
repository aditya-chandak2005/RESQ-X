import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app

client = TestClient(app)

def test_quick_queries_endpoint():
    # Disaster 1 (Chamoli - has analysis)
    res1 = client.get("/api/copilot/quick-queries/1")
    assert res1.status_code == 200
    data1 = res1.json()
    assert isinstance(data1, list)
    assert len(data1) >= 8
    # For Chamoli, flood queries should be marked available
    flood_query = next((q for q in data1 if q["category"] == "flood_situation"), None)
    assert flood_query is not None
    assert flood_query["is_available"] is True
    assert flood_query["badge"] in ["GIS VERIFIED", "SAR ANALYSIS", "HIGH SEVERITY"]

    # Disaster 3 (Historical Kopili - pending analysis)
    res3 = client.get("/api/copilot/quick-queries/3")
    assert res3.status_code == 200
    data3 = res3.json()
    assert isinstance(data3, list)
    assert len(data3) >= 8
    # For Kopili, GIS queries should be flagged as pending/not available
    kopili_flood_query = next((q for q in data3 if q["category"] == "flood_situation"), None)
    assert kopili_flood_query is not None
    assert kopili_flood_query["is_available"] is False
    assert kopili_flood_query["badge"] in ["PENDING", "SENSORS", "ESTIMATE"]

def test_quick_review_chamoli():
    # Disaster 1 has analysis
    res = client.get("/api/copilot/quick-review/1?review_type=executive")
    assert res.status_code == 200
    data = res.json()
    assert data["has_analysis"] is True
    assert "Chamoli" in data["disaster_name"]
    assert "evidence_breakdown" in data
    assert len(data["evidence_breakdown"]["officially_reported_facts"]) > 0
    assert len(data["evidence_breakdown"]["satellite_observations"]) > 0
    assert len(data["evidence_breakdown"]["gis_derived_results"]) > 0
    assert len(data["evidence_breakdown"]["missing_or_unavailable"]) > 0
    assert data["metrics"]["flooded_area_sqkm"] > 0
    assert len(data["recommended_command_directives"]) > 0

def test_quick_review_no_analysis_incident():
    # Disaster 3 has no flood analysis records
    res = client.get("/api/copilot/quick-review/3?review_type=executive")
    assert res.status_code == 200
    data = res.json()
    assert data["has_analysis"] is False
    # Must NOT invent numerical values for flooded area
    assert "Not available" in str(data["metrics"]["flooded_area_sqkm"])
    assert "evidence_breakdown" in data
    assert len(data["evidence_breakdown"]["missing_or_unavailable"]) > 0
    assert any("not yet generated" in flag.lower() for flag in data["critical_red_flags"])

def test_copilot_query_chamoli_flooded_area():
    payload = {
        "query": "What is the flooded area and how many buildings are affected?",
        "disaster_id": 1
    }
    res = client.post("/api/copilot/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["answer"]) > 10
    # Grounded data should contain the exact verified telemetry
    assert "grounded_data" in data
    assert data["grounded_data"]["total_flooded_area_sqkm"] == 42.8
    assert "42.8" in data["answer"]
    assert len(data["sources"]) > 0
    assert len(data["limitations"]) > 0

def test_disaster_knowledge_catalog():
    res = client.get("/api/copilot/disaster-knowledge")
    assert res.status_code == 200
    catalog = res.json()
    assert isinstance(catalog, list)
    assert len(catalog) >= 7
    # Ensure every item has array fields required by frontend to prevent undefined.map crashes
    for item in catalog:
        assert isinstance(item.get("precursors", []), list)
        assert isinstance(item.get("immediate_dos", []), list)
        assert isinstance(item.get("immediate_donts", []), list)
        assert isinstance(item.get("rescue_priorities", []), list)
        assert isinstance(item.get("safety_checklist", []), list)
        assert isinstance(item.get("warning_signs", []), list)
        assert isinstance(item.get("immediate_actions", []), list)
        assert len(item.get("immediate_dos", [])) > 0
        assert len(item.get("immediate_donts", [])) > 0

def test_disaster_knowledge_rag_search():
    # Relevant search
    req = {"query": "hypothermia first aid for drowning victims in cold water"}
    res = client.post("/api/copilot/knowledge/search", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_results"] > 0
    assert len(data["answer"]) > 0
    assert len(data["citations"]) > 0

def test_disaster_knowledge_irrelevant_search():
    # Completely unrelated query
    req = {"query": "luxury cruise ship ticket prices to saturn rings"}
    res = client.post("/api/copilot/knowledge/search", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "insufficient_evidence"
    assert "No relevant indexed guidelines" in data["answer"]
    assert data["total_results"] == 0

if __name__ == "__main__":
    pytest.main(["-v", __file__])
