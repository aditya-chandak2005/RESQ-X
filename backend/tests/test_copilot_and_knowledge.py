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
    assert flood_query["badge"] in ["GIS VERIFIED", "SAR ANALYSIS", "HIGH SEVERITY", "GLOF GENESIS"]

    # Disaster 6 (Historical Simulation Testbed - pending analysis)
    res6 = client.get("/api/copilot/quick-queries/6")
    assert res6.status_code == 200
    data6 = res6.json()
    assert isinstance(data6, list)
    assert len(data6) >= 8
    # For incident 6 (pending analysis), GIS queries should be flagged as pending/not available
    pending_flood_query = next((q for q in data6 if q["category"] == "flood_situation" and not q["is_available"]), None)
    assert pending_flood_query is not None
    assert pending_flood_query["badge"] in ["PENDING", "SENSORS", "ESTIMATE"]

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
    # Disaster 6 has no flood analysis records
    res = client.get("/api/copilot/quick-review/6?review_type=executive")
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
    assert "42.8" in data["answer"] or data["grounded_data"]["total_flooded_area_sqkm"] == 42.8
    assert len(data["sources"]) > 0
    assert isinstance(data["limitations"], list)

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

def test_query_parser_entities_and_constraints():
    from backend.app.services.copilot.query_parser import CopilotQueryParser
    parser = CopilotQueryParser()

    # Query 1: 10-year rolling window in Assam
    p1 = parser.parse("Show historical floods in Assam during the last 10 years.")
    assert p1.place == "Assam"
    assert p1.hazard_type == "flood"
    assert p1.temporal_start == 2016
    assert p1.temporal_end == 2026
    assert p1.intent in ["timeline", "historical_summary", "timeline_history"]

    # Query 2: Year 2023 with relative location
    p2 = parser.parse("What happened during the 2023 flood in this district?")
    assert p2.place_ref_context is True
    assert p2.temporal_start == 2023
    assert p2.temporal_end == 2023
    assert p2.hazard_type == "flood"

    # Query 3: Infrastructure impact
    p3 = parser.parse("Which villages were cut off, and which roads were blocked?")
    assert p3.intent in ["infrastructure_impact", "infrastructure_damage"]
    assert "roads_bridges" in p3.metrics_requested and "isolated_settlements" in p3.metrics_requested

    # Query 4: Official reports
    p4 = parser.parse("Find official reports for the Chamoli flash flood.")
    assert p4.place == "Chamoli"
    assert p4.intent == "official_reports"

    # Query 5: Nearby facilities
    p5 = parser.parse("What hospitals and shelters are near this selected location?")
    assert p5.intent == "nearby_facilities"
    assert p5.place_ref_context is True

    # Query 6: Comparison
    p6 = parser.parse("Compare flood events in Mumbai and Guwahati.")
    assert p6.is_comparison is True
    assert "Mumbai" in [p6.place, p6.comparison_target]
    assert "Guwahati" in [p6.place, p6.comparison_target]

    # Query 7: Data quality audit
    p7 = parser.parse("Summarize verified damage and identify missing information.")
    assert p7.intent == "data_quality_audit"

def test_copilot_staged_search_endpoint():
    payload = {
        "query": "What hospitals and shelters are near Joshimath?",
        "selected_location": {"latitude": 30.55, "longitude": 79.56, "label": "Joshimath"}
    }
    res = client.post("/api/copilot/staged-search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "staged_results_ready"
    assert "search_constraints" in data
    assert "facilities" in data
    assert len(data["facilities"]) > 0
    assert data["facilities"][0]["asset_type"] in ["hospital", "shelter"]
    assert "latency_ms" in data
    assert data["latency_ms"] < 100

def test_copilot_location_aware_nearby_facilities():
    payload = {
        "query": "What hospitals and shelters are near this selected location?",
        "selected_location": {"latitude": 30.55, "longitude": 79.56, "label": "Joshimath"},
        "mode": "selected_location"
    }
    res = client.post("/api/copilot/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["answer_status"] == "success"
    assert "nearby_facilities" in data
    assert len(data["nearby_facilities"]) > 0
    assert any("Joshimath" in fac["name"] for fac in data["nearby_facilities"])
    assert "retrieval_latency_ms" in data
    assert "total_latency_ms" in data
    assert "evidence_breakdown" in data

def test_copilot_compare_flood_events():
    payload = {
        "query": "Compare flood events in Mumbai and Guwahati.",
        "mode": "global"
    }
    res = client.post("/api/copilot/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["answer_status"] == "success"
    ans = data["answer"]
    assert "Mumbai" in ans
    assert "Guwahati" in ans
    assert "Comparative Analysis" in ans or "Mumbai" in ans

def test_copilot_assam_10_year_timeline():
    payload = {
        "query": "Show historical floods in Assam during the last 10 years.",
        "mode": "global"
    }
    res = client.post("/api/copilot/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["answer_status"] == "success"
    ans = data["answer"]
    assert "Assam" in ans
    assert "matched_events" in data
    assert len(data["matched_events"]) > 0

def test_copilot_latency_under_threshold():
    payload = {
        "query": "Which villages were cut off, and which roads were blocked in Chamoli?",
        "disaster_id": 1
    }
    res = client.post("/api/copilot/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_latency_ms"] < 250
    assert "Raini" in data["answer"] or "tapovan" in data["answer"].lower()

if __name__ == "__main__":
    pytest.main(["-v", __file__])
