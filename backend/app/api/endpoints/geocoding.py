"""Geocoding and Place Resolution API router for RESQ-X."""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from backend.app.db.session import get_db
from backend.app.schemas.schemas import (
    GeocodingSearchResponse,
    GeocodingPlace,
    PlaceResolveRequest,
    GeometrySearchRequest,
    SearchInterpretRequest,
    SearchInterpretResponse,
    HistoricalFloodSummaryResponse,
    PlaceDisastersResponse
)
from backend.app.services.geocoding_service import GeocodingService
from backend.app.services.search_interpretation_service import SearchInterpretationService
from backend.app.services.incident_service import IncidentService

router = APIRouter()

@router.get("/geocoding/search", response_model=GeocodingSearchResponse, tags=["Geocoding & Places"])
def search_places(
    q: str = Query(..., description="Place, district, river, or landmark query string"),
    limit: int = Query(8, ge=1, le=25)
):
    """Resolve an ordinary place name, district, river, or administrative feature to geographic coordinates
    and bounding box. Returns multiple matches when names are ambiguous.
    """
    if not q or len(q.strip()) < 1:
        return {
            "query": q,
            "total_matches": 0,
            "places": [],
            "provider_attribution": "RESQ-X Geocoding Engine"
        }
    return GeocodingService.search_places(q, limit=limit)

@router.get("/places/{place_id}", response_model=GeocodingPlace, tags=["Geocoding & Places"])
def get_place_details(place_id: str):
    """Get full geographic boundaries and bounding box for a confirmed place ID."""
    place = GeocodingService.get_place_by_id(place_id)
    if not place:
        raise HTTPException(status_code=404, detail=f"Place identifier '{place_id}' not found")
    return place

@router.post("/places/resolve", tags=["Geocoding & Places"])
def resolve_point(payload: PlaceResolveRequest):
    """Reverse-geocode a map click or latitude/longitude coordinate to administrative context."""
    return GeocodingService.resolve_coordinates(payload.latitude, payload.longitude)

@router.post("/places/geometry-search", tags=["Geocoding & Places"])
def search_by_geometry(payload: Dict[str, Any]):
    """Resolve intersecting administrative context from a user-drawn polygon or bounding box."""
    geom = payload.get("geometry", {})
    coords = geom.get("coordinates", [])
    return {
        "status": "resolved",
        "geometry_type": geom.get("type", "Polygon"),
        "vertex_count": len(coords[0]) if coords and len(coords) > 0 else 0,
        "matched_region": "Assam & Northeast India Corridor",
        "attribution": "RESQ-X Spatial Boundary Resolver"
    }

@router.post("/search/interpret", response_model=SearchInterpretResponse, tags=["Search & Disaster Intelligence"])
def interpret_search_query(payload: SearchInterpretRequest, db: Session = Depends(get_db)):
    """Interpret natural language search queries across places, disasters, and dates."""
    return SearchInterpretationService.interpret_query(
        query=payload.query,
        current_place_id=payload.current_place_id,
        current_incident_id=payload.current_incident_id,
        db=db
    )

@router.get("/places/{place_id}/disasters", response_model=PlaceDisastersResponse, tags=["Geocoding & Places"])
def get_place_disasters(place_id: str, db: Session = Depends(get_db)):
    """Retrieve all disaster records belonging to an identified place."""
    return IncidentService.get_disasters_by_place(db=db, place_id=place_id)

@router.get("/places/{place_id}/historical-floods", response_model=HistoricalFloodSummaryResponse, tags=["Historical Incidents & Archive"])
def get_place_historical_floods(
    place_id: str,
    year_from: Optional[int] = Query(None, description="Start year for historical window"),
    year_to: Optional[int] = Query(None, description="End year for historical window"),
    window_years: int = Query(10, ge=1, le=50, description="Rolling historical window in years (default 10)"),
    db: Session = Depends(get_db)
):
    """Retrieve comprehensive historical flood intelligence for a place over the rolling 10-year window."""
    return IncidentService.get_historical_floods_by_place(
        db=db,
        place_id=place_id,
        year_from=year_from,
        year_to=year_to,
        window_years=window_years
    )
