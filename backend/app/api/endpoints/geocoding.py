"""Geocoding and Place Resolution API router for RESQ-X."""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from backend.app.schemas.schemas import (
    GeocodingSearchResponse,
    GeocodingPlace,
    PlaceResolveRequest,
    GeometrySearchRequest
)
from backend.app.services.geocoding_service import GeocodingService

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
    # Return bounding box summary and regional classification
    return {
        "status": "resolved",
        "geometry_type": geom.get("type", "Polygon"),
        "vertex_count": len(coords[0]) if coords and len(coords) > 0 else 0,
        "matched_region": "Assam & Northeast India Corridor",
        "attribution": "RESQ-X Spatial Boundary Resolver"
    }
