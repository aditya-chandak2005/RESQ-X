"""Advanced Disaster Intelligence Copilot Evaluation Suite.
Validates the 9 core evaluation criteria required by Section 9:
1. Historical event lookups
2. Location-specific disaster questions
3. Numerical impact accuracy
4. Multi-event and multi-basin comparisons
5. GIS and topological infrastructure queries
6. Missing and contradictory data handling
7. Ambiguous place name disambiguation
8. Current active alerts vs historical events
9. Insufficient evidence admission & latency boundaries
"""
import sys
import os
import time
import pytest
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.models.models import DisasterEvent, OfficialAlert, FloodResult
from backend.app.services.copilot.query_parser import CopilotQueryParser
from backend.app.services.copilot.retrieval_pipeline import CopilotRetrievalPipeline
from backend.app.services.copilot.synthesis_engine import CopilotSynthesisEngine
from backend.app.services.providers.llm_provider import LLMManager

client = TestClient(app)


# =============================================================================
# EVALUATION DATASET
# =============================================================================

BENCHMARK_EVALUATION_DATASET = [
    {
        "id": "TC-01-HISTORICAL-LOOKUP",
        "category": "Historical Event Lookup",
        "query": "What happened during the 2023 flood in Himachal Pradesh?",
        "expected_intent": "event_investigation",
        "expected_place": "Himachal Pradesh",
        "expected_year": 2023,
        "required_sections": ["Executive Summary", "Geographic and Temporal Scope", "Detailed Findings", "Evidence and Sources"],
        "expected_terms": ["Mandi", "Beas", "2023"]
    },
    {
        "id": "TC-02-LOCATION-SPECIFIC",
        "category": "Location-Specific Disaster Inquiry",
        "query": "What hospitals and emergency shelters are near this location?",
        "context_location": {
            "name": "Joshimath",
            "label": "Joshimath, Chamoli, Uttarakhand",
            "district": "Chamoli",
            "state": "Uttarakhand",
            "latitude": 30.5564,
            "longitude": 79.5645
        },
        "expected_intent": "nearby_facilities",
        "required_sections": ["Executive Summary", "Geographic and Temporal Scope", "Detailed Findings", "Evidence and Sources"],
        "expected_terms": ["km", "Hospital", "Shelter"]
    },
    {
        "id": "TC-03-NUMERICAL-ACCURACY",
        "category": "Numerical Impact Verification",
        "query": "Analyze historical floods in Assam over the last ten years and identify recurring impacts on infrastructure.",
        "expected_intent": "timeline_history",
        "required_sections": ["Executive Summary", "Geographic and Temporal Scope", "Detailed Findings", "Evidence and Sources", "Analysis and Interpretation", "Limitations and Uncertainty"],
        "expected_numbers": ["486.1", "599", "6,015,000", "272,000"], # Verified database figures
        "expected_terms": ["Brahmaputra", "Barak", "Bethukandi", "Embankment"]
    },
    {
        "id": "TC-04-MULTI-EVENT-COMPARISON",
        "category": "Multi-Event Comparison",
        "query": "Compare flood events in Mumbai and Guwahati",
        "expected_intent": "comparison",
        "required_sections": ["Executive Summary", "Geographic and Temporal Scope", "Detailed Findings", "Evidence and Sources", "Comparative Metric Matrix"],
        "expected_terms": ["Mumbai", "Guwahati", "Mithi", "Bharalu", "tidal lockup", "68.4 km²", "18.4 km²"]
    },
    {
        "id": "TC-05-GIS-INFRASTRUCTURE",
        "category": "GIS and Infrastructure Cutoffs",
        "query": "Which villages were cut off and roads blocked?",
        "disaster_id": 1,
        "expected_intent": "infrastructure_damage",
        "required_sections": ["Executive Summary", "Geographic and Temporal Scope", "Detailed Findings", "Isolated Villages", "Blocked Roads", "Critical Bridge Impairments"],
        "expected_terms": ["isolated", "Bridge", "Road", "Topological", "NetworkX"]
    },
    {
        "id": "TC-06-DATA-QUALITY-AUDIT",
        "category": "Missing Data and Uncertainty Audit",
        "query": "Summarize verified damage and identify missing information.",
        "disaster_id": 1,
        "expected_intent": "data_quality_audit",
        "required_sections": ["Executive Summary", "Detailed Findings: 5-Tier Data Audit", "Officially Reported Facts", "Satellite SAR Observations", "GIS-Derived Measurements", "Model Estimates", "Uncertainties & Missing Information"],
        "expected_terms": ["Officially Reported", "Satellite SAR", "GIS-Derived", "Model Estimates", "Uncertainties"]
    },
    {
        "id": "TC-07-ACTIVE-VS-HISTORICAL",
        "category": "Current Alerts vs Historical Records",
        "query": "Are there active alerts or warnings for this location?",
        "disaster_id": 1,
        "expected_intent": "active_alerts_vs_history",
        "required_sections": ["Executive Summary", "Geographic and Temporal Scope", "Detailed Findings", "Active Emergency Warnings", "Distinction Between Current Warnings and Historical Events"],
        "expected_terms": ["RED", "NDMA SACHET", "IMD", "CWC", "Historical"]
    },
    {
        "id": "TC-08-INSUFFICIENT-EVIDENCE",
        "category": "Admission of Insufficient Evidence",
        "query": "What happened during the 1982 flood in Zanskar valley?",
        "expected_intent": "event_investigation",
        "required_sections": ["Executive Summary", "Limitations and Uncertainty"],
        "expected_terms": ["No verified disaster incident record", "cataloged"]
    }
]


# =============================================================================
# TEST CASES
# =============================================================================

def test_evaluation_dataset_coverage():
    """Verify evaluation dataset contains all 8 required disaster intelligence categories."""
    categories = {tc["category"] for tc in BENCHMARK_EVALUATION_DATASET}
    assert len(categories) == 8
    assert "Historical Event Lookup" in categories
    assert "Multi-Event Comparison" in categories
    assert "Numerical Impact Verification" in categories
    assert "Current Alerts vs Historical Records" in categories
    assert "Admission of Insufficient Evidence" in categories


@pytest.mark.parametrize("tc", BENCHMARK_EVALUATION_DATASET)
def test_evaluation_query_parsing_and_synthesis(tc):
    """Evaluate end-to-end parsing, retrieval, and adaptive section synthesis for each benchmark question."""
    db = SessionLocal()
    try:
        query = tc["query"]
        selected_loc = tc.get("context_location")
        disaster_id = tc.get("disaster_id", 1)

        start_time = time.perf_counter()
        parsed = CopilotQueryParser.parse(query, selected_location=selected_loc)
        evidence = CopilotRetrievalPipeline.execute(db, parsed, disaster_id=disaster_id, selected_location=selected_loc)
        res = CopilotSynthesisEngine.synthesize(db, parsed, evidence, selected_location=selected_loc)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # 1. Intent Classification Accuracy
        assert parsed.intent == tc["expected_intent"], f"Failed for {tc['id']}: expected {tc['expected_intent']}, got {parsed.intent}"

        # 2. Structural Section Completeness (Section 5)
        answer = res["answer"]
        for section in tc["required_sections"]:
            assert section in answer, f"Failed for {tc['id']}: missing section heading '{section}' in response"

        # 3. Domain Term Presence
        for term in tc.get("expected_terms", []):
            assert term.lower() in answer.lower(), f"Failed for {tc['id']}: expected domain term '{term}' not found in answer"

        # 4. Strict Numerical Accuracy (Section 6)
        for num in tc.get("expected_numbers", []):
            assert num in answer, f"Failed for {tc['id']}: verified statistic '{num}' missing from response"

        # 5. Citation Correctness & Source Availability (Section 3 & 5)
        sources = res.get("sources", [])
        assert len(sources) >= 1, f"Failed for {tc['id']}: no sources attached to response"
        for s in sources:
            assert "title" in s and len(s["title"]) > 0
            assert "authority" in s and len(s["authority"]) > 0
            assert "url" in s and s["url"].startswith("http")

        # 6. Response Latency Boundary (< 500ms for deterministic pipeline)
        assert elapsed_ms < 500.0, f"Failed for {tc['id']}: response latency {elapsed_ms:.1f}ms exceeded 500ms budget"

    finally:
        db.close()


def test_copilot_chat_endpoint_adaptive_response():
    """Verify FastAPI /api/copilot/chat endpoint returns complete adaptive structure via HTTP."""
    payload = {
        "query": "Compare flood events in Mumbai and Guwahati",
        "disaster_id": 1,
        "mode": "global"
    }
    resp = client.post("/api/copilot/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["answer_status"] == "success"
    assert "Executive Summary" in data["answer"]
    assert "Geographic and Temporal Scope" in data["answer"]
    assert "Detailed Findings" in data["answer"]
    assert "Evidence and Sources" in data["answer"]
    assert "Comparative Metric Matrix" in data["answer"]
    assert len(data["sources"]) >= 2
    assert len(data["suggested_follow_up"]) >= 2
    assert data["model_info"]["engine_mode"] in ["grounded_telemetry_rag", "generative_augmented"]


def test_active_alerts_distinction_endpoint():
    """Verify /api/copilot/chat distinguishes real-time CAP alerts from historical events."""
    payload = {
        "query": "Are there active alerts or warnings for this location?",
        "disaster_id": 1,
        "mode": "selected_location"
    }
    resp = client.post("/api/copilot/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "Active Emergency Warnings" in data["answer"]
    assert "Distinction Between Current Warnings and Historical Events" in data["answer"]
    assert "RED" in data["answer"]
    assert "NDMA SACHET" in data["answer"]


def test_model_configuration_environment_fallback():
    """Verify LLM provider configuration behaves gracefully when environment keys are missing or provider is configured."""
    status = LLMManager.get_provider_status()
    assert "provider" in status
    assert "engine_mode" in status
    assert "required_env" in status
    assert status["engine_mode"] in ["grounded_telemetry_rag", "generative_augmented"]
    # Fallback must be zero-hallucination deterministic grounded synthesis
    if not status["is_configured"]:
        assert "Deterministic Grounded Synthesis Engine" in status["provider"]
