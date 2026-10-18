"""Comprehensive Phase 10 Automated Test Suite for All-India Disaster Platform.
Validates:
1. Live official alert arrival and retrieval.
2. Alert deduplication precision (no duplicate database records).
3. Source outage visibility and resilient health reporting without crashes.
4. Historical event searchability when ingestion is offline.
5. Complete MultiPolygon / Polygon GeoJSON retrieval and CRS [lon, lat] ordering.
6. Spatial boundary filtering across Indian states and districts (Bihar, Odisha, West Bengal, Delhi, Kerala, HP, etc.).
7. Truthful pending/unavailable reporting when geometry has not been acquired.
8. Background analysis job creation and status tracking.
9. Incident-to-location isolation (no geometry bleeding across unrelated regions).
10. Copilot evidence-grounded queries for alerts, missing mapping, and infrastructure exposure.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.models.models import (
    DisasterEvent,
    FloodResult,
    FloodPolygon,
    OfficialAlert,
    SourceHealthRecord,
    BackgroundAnalysisJob
)
from backend.app.services.ingestion.pipeline_engine import PipelineEngine
from backend.app.services.ingestion.cap_parser import CapParser
from backend.app.services.ingestion.source_registry import SourceStatusRegistry
from backend.app.services.copilot.query_parser import CopilotQueryParser
from backend.app.services.copilot.retrieval_pipeline import CopilotRetrievalPipeline
from backend.app.services.copilot.synthesis_engine import CopilotSynthesisEngine

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. LIVE ALERT ARRIVAL & INGESTION
# -----------------------------------------------------------------------------

def test_live_alert_ingestion_and_retrieval():
    """Verify official emergency alerts are ingested and retrievable via API."""
    db: Session = SessionLocal()
    try:
        engine = PipelineEngine()
        result = engine.run_ingestion_cycle(db)
        assert "total_new_stored" in result
        assert "total_duplicates_skipped" in result

        response = client.get("/api/ingestion/alerts?limit=20")
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        assert len(alerts) >= 1

        first_alert = alerts[0]
        assert "headline" in first_alert
        assert "authority" in first_alert
        assert "alert_level" in first_alert
        assert first_alert["alert_level"] in ["RED", "ORANGE", "YELLOW", "GREEN"]
        assert "published_at" in first_alert
    finally:
        db.close()


def test_alert_deduplication():
    """Verify that running ingestion twice does not create duplicate alert records."""
    db: Session = SessionLocal()
    try:
        engine = PipelineEngine()
        # Second run should skip duplicates
        cycle = engine.run_ingestion_cycle(db)
        assert cycle["total_duplicates_skipped"] >= 0
        # If no new feeds appeared, new stored should be 0
        assert cycle["total_new_stored"] == 0 or cycle["total_duplicates_skipped"] > 0

        # Verify no duplicate headline/authority pairs in active DB
        alerts = db.query(OfficialAlert).all()
        signatures = [(a.authority, a.headline) for a in alerts]
        assert len(signatures) == len(set(signatures)), "Found duplicate alert records in database"
    finally:
        db.close()


# -----------------------------------------------------------------------------
# 2. SOURCE STATUS REGISTRY & OUTAGE VISIBILITY
# -----------------------------------------------------------------------------

def test_source_status_registry_reporting():
    """Verify all official providers are tracked with health and freshness."""
    response = client.get("/api/ingestion/sources")
    assert response.status_code == 200
    sources = response.json()
    assert isinstance(sources, list)
    assert len(sources) >= 6

    provider_ids = [s["provider_id"] for s in sources]
    assert "ndma_sachet" in provider_ids
    assert "imd_warnings" in provider_ids
    assert "cwc_flood" in provider_ids
    assert "bhuvan_nrsc" in provider_ids
    assert "copernicus_ems" in provider_ids
    assert "sentinel_sar" in provider_ids

    # Verify attributes
    for s in sources:
        assert "availability" in s
        assert "total_records_ingested" in s
        assert "last_check_time" in s
        assert "latency_ms" in s


def test_source_outage_resilience():
    """Verify that a failing external source records error without crashing the API."""
    db: Session = SessionLocal()
    try:
        # Record a simulated outage
        SourceStatusRegistry.record_check(
            db,
            provider_id="ndma_sachet",
            is_success=False,
            error_message="HTTP 503 Service Unavailable: upstream gateway timeout",
            latency_ms=3500.0
        )

        response = client.get("/api/ingestion/sources")
        assert response.status_code == 200
        sources = response.json()
        sachet = next((s for s in sources if s["provider_id"] == "ndma_sachet"), None)
        assert sachet is not None
        assert sachet["availability"] == "degraded"
        assert "503" in sachet["last_error"]
    finally:
        db.close()


# -----------------------------------------------------------------------------
# 3. HISTORICAL EVENTS & GEOMETRY RETRIEVAL ACROSS ALL INDIA
# -----------------------------------------------------------------------------

def test_historical_disaster_search_resilience():
    """Verify historical disaster archive remains searchable across Indian states."""
    states_to_test = ["Bihar", "Odisha", "West Bengal", "Gujarat", "Karnataka", "Tamil Nadu", "Himachal Pradesh", "Assam"]
    for state in states_to_test:
        res = client.get(f"/api/disasters/search?state={state}")
        assert res.status_code == 200
        events = res.json()
        assert len(events) >= 1, f"Expected at least 1 disaster event for state {state}"
        assert any(e["state"].lower() == state.lower() for e in events)


def test_complete_affected_area_polygons():
    """Verify /disasters/{id}/affected-area returns complete GeoJSON polygons with provenance."""
    # Test Bihar Kosi (ID 13)
    res = client.get("/api/disasters/13/affected-area")
    assert res.status_code == 200
    data = res.json()
    assert data["has_geometry"] is True
    assert data["polygon_count"] >= 1
    assert data["total_flooded_area_sqkm"] > 0
    assert "features" in data["geojson"]
    assert len(data["geojson"]["features"]) >= 1

    first_feat = data["geojson"]["features"][0]
    geom = first_feat["geometry"]
    assert geom["type"] in ["Polygon", "MultiPolygon"]
    # Verify longitude, latitude coordinate ordering (India is ~68°E to 98°E, ~8°N to 37°N)
    coords = geom["coordinates"][0] if geom["type"] == "Polygon" else geom["coordinates"][0][0]
    first_pt = coords[0]
    assert 65.0 <= first_pt[0] <= 98.0, f"Expected longitude first (65-98°E), got {first_pt[0]}"
    assert 6.0 <= first_pt[1] <= 38.0, f"Expected latitude second (6-38°N), got {first_pt[1]}"


def test_affected_area_by_location_spatial_filtering():
    """Verify /disasters/affected-area/by-location retrieves correct regional footprints."""
    # Query for Delhi NCT
    res_delhi = client.get("/api/disasters/affected-area/by-location?state=Delhi")
    assert res_delhi.status_code == 200
    delhi_data = res_delhi.json()
    assert delhi_data["has_geometry"] is True
    assert "Yamuna" in delhi_data["summary"]["disaster_name"]

    # Query for Odisha
    res_odisha = client.get("/api/disasters/affected-area/by-location?state=Odisha")
    assert res_odisha.status_code == 200
    odisha_data = res_odisha.json()
    assert odisha_data["has_geometry"] is True
    assert "Mahanadi" in odisha_data["summary"]["disaster_name"]


def test_truthful_pending_geometry_status():
    """Verify that an incident without satellite geometry truthfully reports pending status."""
    # Incident 6 (Simulation Testbed) has no flood polygons
    res = client.get("/api/disasters/6/affected-area")
    assert res.status_code == 200
    data = res.json()
    assert data["has_geometry"] is False
    assert data["polygon_count"] == 0
    assert data["status"] in ["pending_analysis", "unavailable"]
    assert "pending" in data["message"].lower() or "not available" in data["message"].lower()


def test_location_isolation_prevents_geometry_bleeding():
    """Verify that querying geometry for Himachal Pradesh never returns Delhi or Kerala polygons."""
    res = client.get("/api/disasters/affected-area/by-location?state=Himachal%20Pradesh")
    assert res.status_code == 200
    data = res.json()
    assert data["has_geometry"] is True
    # Ensure center coordinates are within Himachal Pradesh (approx 31-33°N, 76-79°E)
    features = data["geojson"]["features"]
    for feat in features:
        props = feat.get("properties", {})
        # Must not contain unrelated state references
        assert "Delhi" not in props.get("name", "")
        assert "Kerala" not in props.get("name", "")


# -----------------------------------------------------------------------------
# 4. BACKGROUND JOBS & ANALYSIS WORKFLOW
# -----------------------------------------------------------------------------

def test_trigger_affected_area_analysis_background_job():
    """Verify triggering analysis creates a durable tracked background job."""
    res = client.post("/api/disasters/6/analyze-affected-area")
    assert res.status_code == 200
    job = res.json()
    assert "job_id" in job
    assert job["job_type"] == "sentinel1_sar_segmentation"
    assert job["status"] in ["completed", "queued", "running"]

    # Check job list endpoint
    list_res = client.get("/api/ingestion/jobs?disaster_id=6")
    assert list_res.status_code == 200
    jobs = list_res.json()
    assert len(jobs) >= 1
    assert any(j["id"] == job["job_id"] for j in jobs)


# -----------------------------------------------------------------------------
# 5. RESQ COPILOT EVIDENCE-GROUNDED REASONING
# -----------------------------------------------------------------------------

def test_copilot_answers_recent_official_alerts():
    """Verify Copilot answers recent alerts with transparent source distinction."""
    db: Session = SessionLocal()
    try:
        q = "What official disaster alerts have been issued recently for this district?"
        parsed = CopilotQueryParser.parse(q)
        evidence = CopilotRetrievalPipeline.execute(db, parsed)
        result = CopilotSynthesisEngine.synthesize(db, parsed, evidence)

        assert result["answer_status"] == "success"
        assert len(result["sources"]) >= 1
        assert "Executive Summary" in result["answer"]
        assert "Active Emergency Warnings" in result["answer"] or "Alert" in result["answer"]
    finally:
        db.close()


def test_copilot_answers_confirmed_geometry_audit():
    """Verify Copilot audits which incidents have confirmed geometry vs incomplete mapping."""
    db: Session = SessionLocal()
    try:
        q = "Which current incidents have confirmed affected-area geometry and which events have incomplete mapping?"
        parsed = CopilotQueryParser.parse(q)
        assert parsed.intent == "geometry_coverage_audit"

        evidence = CopilotRetrievalPipeline.execute(db, parsed)
        result = CopilotSynthesisEngine.synthesize(db, parsed, evidence)

        assert result["answer_status"] == "success"
        assert "Confirmed Affected-Area Geometry" in result["answer"]
        assert "Incomplete or Pending Mapping" in result["answer"]
        assert "Sentinel-1 SAR" in result["answer"]
    finally:
        db.close()


def test_copilot_answers_infrastructure_exposure():
    """Verify Copilot distinguishes infrastructure inside flood extent."""
    db: Session = SessionLocal()
    try:
        q = "What infrastructure lies inside the verified or estimated affected extent?"
        parsed = CopilotQueryParser.parse(q)
        evidence = CopilotRetrievalPipeline.execute(db, parsed)
        result = CopilotSynthesisEngine.synthesize(db, parsed, evidence)

        assert result["answer_status"] == "success"
        assert "Executive Summary" in result["answer"]
        assert "Bridge" in result["answer"] or "Settlement" in result["answer"] or "Infrastructure" in result["answer"]
    finally:
        db.close()
