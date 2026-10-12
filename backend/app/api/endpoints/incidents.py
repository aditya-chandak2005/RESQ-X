"""Historical & Active Disaster Incidents API router for RESQ-X."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from backend.app.db.session import get_db
from backend.app.schemas.schemas import (
    IncidentSearchResponse,
    IncidentDetailResponse,
    DataAvailabilityResponse,
    IncidentSourceResponse
)
from backend.app.services.incident_service import IncidentService

router = APIRouter()

@router.get("/incidents", response_model=IncidentSearchResponse, tags=["Historical Incidents & Archive"])
def search_incidents(
    q: Optional[str] = Query(None, description="Free-text search across disaster names, descriptions, and places"),
    location: Optional[str] = Query(None, description="Location, district, or place name"),
    hazard_type: Optional[str] = Query(None, description="Hazard type (e.g., riverine_flood, flash_flood, urban_flood, or all)"),
    status: Optional[str] = Query(None, description="Incident status (active, historical, monitoring, or all)"),
    state: Optional[str] = Query(None, description="Indian administrative state (e.g. Assam, Uttarakhand)"),
    district: Optional[str] = Query(None, description="District within state (e.g. Cachar, Nagaon, Golaghat, Barpeta)"),
    year_from: Optional[int] = Query(None, description="Filter incidents starting from year"),
    year_to: Optional[int] = Query(None, description="Filter incidents up to year"),
    verification: Optional[str] = Query(None, description="Verification status (verified, unverified, demo, or all)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search and filter disaster incident records with year distribution analytics.

    Initial filter values default to Assam, All disasters, All incidents, and All available years.
    """
    offset = (page - 1) * limit
    return IncidentService.search_incidents(
        db=db,
        query=q,
        location=location,
        hazard_type=hazard_type,
        status=status,
        state=state,
        district=district,
        year_from=year_from,
        year_to=year_to,
        verification=verification,
        limit=limit,
        offset=offset
    )

@router.get("/incidents/{incident_id}", response_model=IncidentDetailResponse, tags=["Historical Incidents & Archive"])
def get_incident_details(incident_id: int, db: Session = Depends(get_db)):
    """Retrieve complete incident record, verified provenance, and summary of connected GIS assets."""
    inc = IncidentService.get_incident_by_id(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Disaster incident with ID {incident_id} not found")
    return inc

@router.get("/incidents/{incident_id}/data-availability", response_model=DataAvailabilityResponse, tags=["Historical Incidents & Archive"])
def get_incident_data_availability(incident_id: int, db: Session = Depends(get_db)):
    """Retrieve honest data availability status: satellite scenes, AI flood extent, infrastructure, and SITREP reports."""
    avail = IncidentService.get_data_availability(db, incident_id)
    if not avail:
        raise HTTPException(status_code=404, detail=f"Disaster incident with ID {incident_id} not found")
    return avail

@router.get("/incidents/{incident_id}/sources", response_model=List[IncidentSourceResponse], tags=["Historical Incidents & Archive"])
def get_incident_sources(incident_id: int, db: Session = Depends(get_db)):
    """Retrieve official government and satellite sources, bulletins, and citations for an incident."""
    sources = IncidentService.get_incident_sources(db, incident_id)
    return sources

@router.post("/incidents/spatial-search", response_model=List[IncidentDetailResponse], tags=["Historical Incidents & Archive"])
def spatial_incident_search(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Search disaster incidents intersecting a bounding box, user-drawn polygon, or near a clicked map point."""
    bbox = payload.get("bbox")
    point = payload.get("point")
    radius_km = payload.get("radius_km", 50.0)
    hazard_type = payload.get("hazard_type")
    year_from = payload.get("year_from")
    year_to = payload.get("year_to")

    return IncidentService.spatial_search(
        db=db,
        bbox=bbox,
        point=point,
        radius_km=radius_km,
        hazard_type=hazard_type,
        year_from=year_from,
        year_to=year_to
    )

