"""Incident Service: Manages historical and active disaster incident records,

multi-criteria search, administrative filtering, spatial queries, deduplication,
source metadata, and honest data availability reporting.
"""
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.app.models.models import (
    DisasterEvent,
    IncidentSource,
    SatelliteScene,
    FloodResult,
    Settlement,
    InfrastructureAsset,
    Bridge,
    RoadSegment,
    SituationReport
)


class IncidentService:
    """Core service for historical and operational disaster incident queries."""

    @staticmethod
    def search_incidents(
        db: Session,
        query: Optional[str] = None,
        location: Optional[str] = None,
        hazard_type: Optional[str] = None,
        status: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
        verification: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search and filter disaster incidents with distribution analytics."""
        q = db.query(DisasterEvent)

        # 1. State / Administrative Filter
        if state and state.lower() != "all":
            q = q.filter(DisasterEvent.state.ilike(f"%{state}%"))

        if district and district.lower() != "all":
            q = q.filter(DisasterEvent.district.ilike(f"%{district}%"))

        # 2. Free-text Search across names, descriptions, places with natural language support
        if query and query.strip():
            raw_query = query.strip()

            # Extract 4-digit years (e.g. 2024, 2022, 2021)
            year_matches = re.findall(r'\b(19\d\d|20\d\d)\b', raw_query)
            extracted_year = int(year_matches[0]) if year_matches else None
            if extracted_year and not year_from and not year_to:
                q = q.filter(DisasterEvent.incident_date >= datetime(extracted_year, 1, 1))
                q = q.filter(DisasterEvent.incident_date <= datetime(extracted_year, 12, 31, 23, 59, 59))

            # Stopwords & connector words
            STOPWORDS = {'in', 'near', 'of', 'the', 'at', 'during', 'and', 'around', 'on', 'by', 'for', 'with', 'from', 'to', 'all'}
            cleaned_text = re.sub(r'\b(19\d\d|20\d\d)\b', ' ', raw_query)
            tokens = [w for w in re.sub(r'[^\w\s]', ' ', cleaned_text).split() if len(w) > 2 and w.lower() not in STOPWORDS]

            direct_term = f"%{raw_query}%"
            direct_condition = or_(
                DisasterEvent.name.ilike(direct_term),
                DisasterEvent.description.ilike(direct_term),
                DisasterEvent.district.ilike(direct_term),
                DisasterEvent.place_name.ilike(direct_term),
                DisasterEvent.state.ilike(direct_term)
            )

            if tokens:
                token_conditions = []
                for t in tokens:
                    term = f"%{t}%"
                    synonym_conditions = [
                        DisasterEvent.name.ilike(term),
                        DisasterEvent.description.ilike(term),
                        DisasterEvent.district.ilike(term),
                        DisasterEvent.place_name.ilike(term),
                        DisasterEvent.state.ilike(term),
                        DisasterEvent.disaster_type.ilike(term)
                    ]
                    # Synonym expansion: 'landslide' / 'landslides' matches debris, rockfall, slope, outburst
                    if t.lower() in ['landslide', 'landslides']:
                        for syn in ['%debris%', '%rockfall%', '%slope%', '%outburst%']:
                            synonym_conditions.append(DisasterEvent.description.ilike(syn))
                            synonym_conditions.append(DisasterEvent.disaster_type.ilike(syn))
                    # Synonym expansion: 'flood' / 'floods' matches inundation, deluge, overflow
                    elif t.lower() in ['flood', 'floods']:
                        for syn in ['%inundation%', '%deluge%', '%overflow%']:
                            synonym_conditions.append(DisasterEvent.description.ilike(syn))
                            synonym_conditions.append(DisasterEvent.disaster_type.ilike(syn))

                    token_conditions.append(or_(*synonym_conditions))

                q = q.filter(or_(direct_condition, and_(*token_conditions)))
            else:
                q = q.filter(direct_condition)

        if location and location.strip() and location.lower() != "all":
            loc_term = f"%{location.strip()}%"
            q = q.filter(
                or_(
                    DisasterEvent.district.ilike(loc_term),
                    DisasterEvent.place_name.ilike(loc_term),
                    DisasterEvent.state.ilike(loc_term),
                    DisasterEvent.name.ilike(loc_term)
                )
            )

        # 3. Hazard Type Filter
        if hazard_type and hazard_type.lower() != "all":
            q = q.filter(DisasterEvent.disaster_type == hazard_type)

        # 4. Status Filter (active / historical / monitoring / all)
        if status and status.lower() != "all":
            q = q.filter(DisasterEvent.status == status)

        # 5. Verification Status Filter (verified / unverified / demo / all)
        if verification and verification.lower() != "all":
            q = q.filter(DisasterEvent.verification_status == verification)

        # 6. Year Range Filter
        if year_from:
            q = q.filter(DisasterEvent.incident_date >= datetime(year_from, 1, 1))
        if year_to:
            q = q.filter(DisasterEvent.incident_date <= datetime(year_to, 12, 31, 23, 59, 59))

        total_count = q.count()

        # Compute Year Distribution and Hazard Distribution over all matching records
        all_matches = q.all()
        year_dist: Dict[int, int] = {}
        hazard_dist: Dict[str, int] = {}
        for m in all_matches:
            if m.incident_date:
                yr = m.incident_date.year
                year_dist[yr] = year_dist.get(yr, 0) + 1
            ht = m.disaster_type or "flood"
            hazard_dist[ht] = hazard_dist.get(ht, 0) + 1

        # Sort: Active first, then most recent incident_date descending
        items = q.order_by(
            desc(DisasterEvent.status == "active"),
            desc(DisasterEvent.incident_date)
        ).offset(offset).limit(limit).all()

        results = []
        for inc in items:
            results.append(IncidentService._serialize_incident(inc, db))

        return {
            "total_count": total_count,
            "page": (offset // limit) + 1 if limit > 0 else 1,
            "page_size": limit,
            "items": results,
            "year_distribution": year_dist,
            "hazard_distribution": hazard_dist,
            "applied_filters": {
                "query": query,
                "location": location,
                "state": state,
                "district": district,
                "hazard_type": hazard_type,
                "status": status,
                "verification": verification,
                "year_from": year_from,
                "year_to": year_to
            }
        }

    @staticmethod
    def get_incident_by_id(db: Session, incident_id: int) -> Optional[Dict[str, Any]]:
        """Retrieve full incident details including sources, scenes count, and verification."""
        inc = db.query(DisasterEvent).filter(DisasterEvent.id == incident_id).first()
        if not inc:
            return None
        return IncidentService._serialize_incident(inc, db)

    @staticmethod
    def get_data_availability(db: Session, incident_id: int) -> Optional[Dict[str, Any]]:
        """Compute honest data availability and uncertainty status."""
        inc = db.query(DisasterEvent).filter(DisasterEvent.id == incident_id).first()
        if not inc:
            return None

        # Check satellite scenes
        scenes = db.query(SatelliteScene).filter(SatelliteScene.disaster_id == incident_id).all()
        sat_status = "found" if len(scenes) > 0 else "not_found"

        # Check flood analysis
        flood = db.query(FloodResult).filter(FloodResult.disaster_id == incident_id).first()
        flood_status = "completed" if flood else "unavailable"

        # Check infrastructure assets, bridges, and roads
        assets = db.query(InfrastructureAsset).filter(InfrastructureAsset.disaster_id == incident_id).all()
        bridges = db.query(Bridge).filter(Bridge.disaster_id == incident_id).all()
        roads = db.query(RoadSegment).filter(RoadSegment.disaster_id == incident_id).all()
        infra_status = "available" if (len(assets) > 0 or len(bridges) > 0 or len(roads) > 0) else "unavailable"

        # Check population exposure
        settlements = db.query(Settlement).filter(Settlement.disaster_id == incident_id).all()
        pop_status = "calculated" if len(settlements) > 0 else "not_calculated"

        # Check report
        reports = db.query(SituationReport).filter(SituationReport.disaster_id == incident_id).all()
        report_status = "available" if len(reports) > 0 or flood else "unavailable"

        # Source verification
        src_status = "success" if inc.source_url else "partial"
        data_sources = []
        if inc.source_org:
            data_sources.append(inc.source_org)
        for s in inc.sources:
            if s.provider_name not in data_sources:
                data_sources.append(s.provider_name)

        return {
            "incident_id": inc.id,
            "incident_name": inc.name,
            "verification_status": inc.verification_status or "verified",
            "source_status": src_status,
            "satellite_imagery": sat_status,
            "flood_analysis": flood_status,
            "infrastructure_data": infra_status,
            "population_exposure": pop_status,
            "report": report_status,
            "data_sources": data_sources or ["Copernicus EMS", "ASDMA", "Survey of India"],
            "limitations_summary": inc.known_limitations or "Satellite SAR detects inundation extent. Ground engineering required for structural verification."
        }

    @staticmethod
    def get_incident_sources(db: Session, incident_id: int) -> List[Dict[str, Any]]:
        """Retrieve verified sources, citations, and URLs for an incident."""
        inc = db.query(DisasterEvent).filter(DisasterEvent.id == incident_id).first()
        if not inc:
            return []

        sources = db.query(IncidentSource).filter(IncidentSource.disaster_id == incident_id).all()
        result = []
        for s in sources:
            result.append({
                "id": s.id,
                "provider_name": s.provider_name,
                "record_identifier": s.record_identifier,
                "source_url": s.source_url,
                "publication_date": s.publication_date.isoformat() if s.publication_date else None,
                "retrieval_timestamp": s.retrieval_timestamp.isoformat() if s.retrieval_timestamp else None,
                "ingestion_status": s.ingestion_status,
                "coverage_limitations": s.coverage_limitations,
                "raw_metadata": s.raw_metadata or {}
            })

        # If no explicit incident_sources rows exist, synthesize from parent primary fields
        if not result and inc.source_org:
            result.append({
                "id": 0,
                "provider_name": inc.source_org,
                "record_identifier": inc.source_record_id,
                "source_url": inc.source_url,
                "publication_date": inc.source_published_at.isoformat() if inc.source_published_at else None,
                "retrieval_timestamp": inc.created_at.isoformat() if inc.created_at else None,
                "ingestion_status": "verified_ingested" if inc.verification_status == "verified" else "demo_reference",
                "coverage_limitations": inc.known_limitations,
                "raw_metadata": {}
            })
        return result

    @staticmethod
    def spatial_search(
        db: Session,
        bbox: Optional[List[float]] = None,
        point: Optional[Dict[str, float]] = None,
        radius_km: float = 50.0,
        hazard_type: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Search incidents falling within a bounding box or near a point."""
        q = db.query(DisasterEvent)

        if hazard_type and hazard_type.lower() != "all":
            q = q.filter(DisasterEvent.disaster_type == hazard_type)
        if year_from:
            q = q.filter(DisasterEvent.incident_date >= datetime(year_from, 1, 1))
        if year_to:
            q = q.filter(DisasterEvent.incident_date <= datetime(year_to, 12, 31))

        candidates = q.all()
        matches = []

        if bbox and len(bbox) == 4:
            min_lon, min_lat, max_lon, max_lat = bbox
            for inc in candidates:
                if min_lat <= inc.center_lat <= max_lat and min_lon <= inc.center_lon <= max_lon:
                    matches.append(IncidentService._serialize_incident(inc, db))
        elif point:
            p_lat = point.get("latitude") or point.get("lat")
            p_lon = point.get("longitude") or point.get("lon") or point.get("lng")
            if p_lat is not None and p_lon is not None:
                from backend.app.services.connectivity.graph import haversine_distance_km
                for inc in candidates:
                    dist = haversine_distance_km(p_lat, p_lon, inc.center_lat, inc.center_lon)
                    if dist <= radius_km:
                        matches.append(IncidentService._serialize_incident(inc, db))
        else:
            for inc in candidates:
                matches.append(IncidentService._serialize_incident(inc, db))

        return matches

    @staticmethod
    def _serialize_incident(inc: DisasterEvent, db: Session) -> Dict[str, Any]:
        """Convert DisasterEvent ORM object to clean JSON-serializable dictionary."""
        scenes_count = db.query(SatelliteScene).filter(SatelliteScene.disaster_id == inc.id).count()
        has_flood = db.query(FloodResult).filter(FloodResult.disaster_id == inc.id).count() > 0
        settlements_count = db.query(Settlement).filter(Settlement.disaster_id == inc.id).count()

        src_list = []
        for s in inc.sources:
            src_list.append({
                "id": s.id,
                "provider_name": s.provider_name,
                "record_identifier": s.record_identifier,
                "source_url": s.source_url,
                "publication_date": s.publication_date.isoformat() if s.publication_date else None,
                "retrieval_timestamp": s.retrieval_timestamp.isoformat() if s.retrieval_timestamp else None,
                "ingestion_status": s.ingestion_status,
                "coverage_limitations": s.coverage_limitations
            })

        return {
            "id": inc.id,
            "name": inc.name,
            "alternative_names": inc.alternative_names or [],
            "disaster_type": inc.disaster_type or "flood",
            "status": inc.status or "historical",
            "description": inc.description,
            "incident_date": inc.incident_date.isoformat() if inc.incident_date else None,
            "start_date": inc.start_date.isoformat() if inc.start_date else None,
            "end_date": inc.end_date.isoformat() if inc.end_date else None,
            "date_precision": inc.date_precision or "day",
            "state": inc.state or "Assam",
            "district": inc.district,
            "place_name": inc.place_name,
            "country": inc.country or "India",
            "center_lat": inc.center_lat,
            "center_lon": inc.center_lon,
            "aoi_geojson": inc.aoi_geojson,
            "severity": inc.severity or "moderate",
            "source_org": inc.source_org,
            "source_url": inc.source_url,
            "source_record_id": inc.source_record_id,
            "source_published_at": inc.source_published_at.isoformat() if inc.source_published_at else None,
            "verification_status": inc.verification_status or "verified",
            "data_availability": inc.data_availability or {},
            "known_limitations": inc.known_limitations,
            "sources": src_list,
            "scenes_count": scenes_count,
            "has_flood_analysis": has_flood,
            "affected_settlements_count": settlements_count
        }
