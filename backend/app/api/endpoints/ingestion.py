"""Ingestion and Real-Time Incident Tracking Endpoints.

Provides official source health status, active disaster alerts, manual poll triggers,
SSE event streams, and background analysis job statuses.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
import asyncio
from datetime import datetime

from backend.app.db.session import get_db
from backend.app.models.models import OfficialAlert, ProcessingJob, DisasterEvent
from backend.app.schemas.schemas import OfficialAlertResponse, SourceHealthResponse
from backend.app.services.ingestion.source_registry import SourceStatusRegistry
from backend.app.services.ingestion.pipeline_engine import (
    pipeline_engine,
    register_sse_client,
    unregister_sse_client
)

router = APIRouter()


@router.get("/sources", response_model=List[SourceHealthResponse])
def get_source_registry_status(db: Session = Depends(get_db)):
    """Retrieve operational telemetry and freshness for all registered data sources."""
    return SourceStatusRegistry.get_all_statuses(db)


@router.get("/alerts", response_model=List[OfficialAlertResponse])
def get_active_alerts(
    state: Optional[str] = None,
    district: Optional[str] = None,
    alert_level: Optional[str] = None,
    event_type: Optional[str] = None,
    active_only: bool = True,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve active disaster warnings and incident alerts received from official feeds."""
    q = db.query(OfficialAlert)
    if active_only:
        q = q.filter(OfficialAlert.is_active == True)
    if state and state.lower() != "all":
        q = q.filter(OfficialAlert.state.ilike(f"%{state}%"))
    if district and district.lower() != "all":
        q = q.filter(OfficialAlert.district.ilike(f"%{district}%"))
    if alert_level and alert_level.lower() != "all":
        q = q.filter(OfficialAlert.alert_level == alert_level.upper())
    if event_type and event_type.lower() != "all":
        q = q.filter(OfficialAlert.event_type.ilike(f"%{event_type}%"))

    return q.order_by(OfficialAlert.published_at.desc()).limit(limit).all()


@router.post("/poll")
def trigger_ingestion_poll(
    provider_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Trigger an on-demand ingestion cycle for real-time sources (NDMA, IMD, CWC, etc.)."""
    results = pipeline_engine.run_ingestion_cycle(db, target_provider=provider_id)
    return results


@router.get("/stream")
async def stream_live_alerts(request: Request):
    """Server-Sent Events (SSE) live feed of newly ingested alerts and pipeline events."""
    client_queue = await register_sse_client()

    async def event_generator():
        try:
            # Send initial greeting & ping
            init_payload = json.dumps({
                "type": "connection_established",
                "message": "Connected to RESQ-X Real-Time Alert Engine",
                "timestamp": datetime.utcnow().isoformat()
            })
            yield f"event: connected\ndata: {init_payload}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    # Wait for message with timeout to send keep-alive heartbeats
                    msg = await asyncio.wait_for(client_queue.get(), timeout=15.0)
                    event_type = msg.get("event", "alert")
                    data_str = json.dumps(msg.get("data", {}))
                    yield f"event: {event_type}\ndata: {data_str}\n\n"
                except asyncio.TimeoutError:
                    heartbeat = json.dumps({"timestamp": datetime.utcnow().isoformat(), "status": "alive"})
                    yield f"event: heartbeat\ndata: {heartbeat}\n\n"
        finally:
            unregister_sse_client(client_queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/jobs")
def get_background_jobs(
    disaster_id: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Retrieve status of background satellite analysis, segmentation, and mapping jobs."""
    q = db.query(ProcessingJob)
    if disaster_id:
        q = q.filter(ProcessingJob.disaster_id == disaster_id)

    jobs = q.order_by(ProcessingJob.started_at.desc()).limit(limit).all()
    return [
        {
            "id": j.id,
            "disaster_id": j.disaster_id,
            "job_type": j.job_type,
            "status": j.status,
            "progress_pct": j.progress_pct,
            "stage_name": j.stage_name,
            "stage_details": j.stage_details or {},
            "error_message": j.error_message,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
        }
        for j in jobs
    ]


@router.post("/jobs/{job_id}/retry")
def retry_background_job(job_id: int, db: Session = Depends(get_db)):
    """Retry a failed background remote sensing analysis job."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    job.status = "running"
    job.progress_pct = 15
    job.stage_name = "Re-queued: Acquiring SAR imagery"
    job.error_message = None
    job.started_at = datetime.utcnow()
    db.commit()

    return {"message": "Job re-queued successfully", "job_id": job.id, "status": job.status}
