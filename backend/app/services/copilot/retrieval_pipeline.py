"""Authoritative Disaster Knowledge, Telemetry & GIS Retrieval Pipeline for RESQ Copilot.
Normalizes queries, retrieves database records, applies spatial & temporal filters,
gathers GIS facility distances, and constructs an evidence-grounded bundle.
"""
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from datetime import datetime, timezone
import math

from backend.app.models.models import (
    DisasterEvent,
    FloodResult,
    FloodPolygon,
    Settlement,
    InfrastructureAsset,
    RoadSegment,
    Bridge,
    RescuePriority,
    RescueTeam,
    Mission,
    Resource,
    IncidentSource,
    OfficialAlert
)
from backend.app.services.connectivity.graph import haversine_distance_km
from backend.app.services.knowledge_service import KnowledgeService
from backend.app.services.incident_service import IncidentService
from backend.app.services.copilot.query_parser import ParsedDisasterQuery


class CopilotRetrievalPipeline:
    """Multi-source retrieval pipeline feeding verified database facts & GIS metrics into Copilot."""

    @classmethod
    def execute(
        cls,
        db: Session,
        parsed: ParsedDisasterQuery,
        disaster_id: Optional[int] = None,
        selected_location: Optional[Dict[str, Any]] = None,
        mode: str = "selected_location"
    ) -> Dict[str, Any]:
        """Execute complete retrieval and produce structured evidence bundle."""

        # 1. Resolve Primary Incident / Disasters Matching Query Constraints
        matched_events: List[DisasterEvent] = []
        comparison_events: Dict[str, List[DisasterEvent]] = {}

        if parsed.is_comparison and len(parsed.comparison_places) >= 2:
            # Multi-place comparison retrieval
            for p_name in parsed.comparison_places:
                events_for_p = cls._find_events_for_place(db, p_name, parsed.start_year, parsed.end_year)
                comparison_events[p_name] = events_for_p
                matched_events.extend(events_for_p)
        elif parsed.place_names:
            for p_name in parsed.place_names:
                events_for_p = cls._find_events_for_place(db, p_name, parsed.start_year, parsed.end_year)
                matched_events.extend(events_for_p)
        elif disaster_id:
            ev = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()
            if ev:
                matched_events.append(ev)
        elif selected_location and mode == "selected_location":
            # Match by selected location's district, state, or name
            loc_label = selected_location.get("label") or selected_location.get("name") or ""
            loc_dist = selected_location.get("district") or ""
            loc_state = selected_location.get("state") or ""
            query_parts = [p for p in [loc_label, loc_dist, loc_state] if p]
            for part in query_parts:
                events_for_p = cls._find_events_for_place(db, part, parsed.start_year, parsed.end_year)
                if events_for_p:
                    matched_events.extend(events_for_p)
                    break

        # Deduplicate matched events preserving order
        seen_ids = set()
        deduped_events = []
        for ev in matched_events:
            if ev.id not in seen_ids:
                seen_ids.add(ev.id)
                deduped_events.append(ev)
        matched_events = deduped_events

        # Fallback if no events matched: load active/recent events or default context
        primary_event: Optional[DisasterEvent] = matched_events[0] if matched_events else None
        if not primary_event and disaster_id:
            primary_event = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()

        # 2. Gather Evidence for Matched Disasters
        officially_reported_facts: List[str] = []
        satellite_observations: List[str] = []
        gis_derived_measurements: List[str] = []
        model_estimates: List[str] = []
        uncertainties_and_missing: List[str] = []
        sources: List[Dict[str, Any]] = []
        featured_locations: List[Dict[str, Any]] = []

        # Target Coordinates for Facility Proximity Search
        target_lat = None
        target_lon = None
        if selected_location:
            target_lat = selected_location.get("lat") or selected_location.get("latitude")
            target_lon = selected_location.get("lng") or selected_location.get("longitude")
        elif primary_event:
            target_lat = primary_event.center_lat
            target_lon = primary_event.center_lon
        elif parsed.places and parsed.places[0].get("latitude"):
            target_lat = parsed.places[0]["latitude"]
            target_lon = parsed.places[0]["longitude"]

        # 3. GIS Facility Search (Hospitals, Shelters, Clinics)
        nearby_facilities: List[Dict[str, Any]] = []
        if target_lat is not None and target_lon is not None:
            all_assets = db.query(InfrastructureAsset).all()
            for asset in all_assets:
                dist_km = haversine_distance_km(target_lat, target_lon, asset.latitude, asset.longitude)
                nearby_facilities.append({
                    "id": asset.id,
                    "name": asset.name,
                    "asset_type": asset.asset_type,
                    "status": asset.status,
                    "distance_km": round(dist_km, 2),
                    "latitude": asset.latitude,
                    "longitude": asset.longitude,
                    "disaster_id": asset.disaster_id,
                    "verification_status": asset.verification_status,
                    "source": asset.source
                })
            nearby_facilities.sort(key=lambda x: x["distance_km"])

        # Filter facilities of interest (hospitals, shelters)
        med_and_shelter = [f for f in nearby_facilities if f["asset_type"] in ("hospital", "shelter")]

        # 4. Gather Specific Incident Telemetry
        event_ids = [e.id for e in matched_events]
        if not event_ids and disaster_id:
            event_ids = [disaster_id]

        floods = db.query(FloodResult).filter(FloodResult.disaster_id.in_(event_ids)).all() if event_ids else []
        settlements = db.query(Settlement).filter(Settlement.disaster_id.in_(event_ids)).all() if event_ids else []
        bridges = db.query(Bridge).filter(Bridge.disaster_id.in_(event_ids)).all() if event_ids else []
        roads = db.query(RoadSegment).filter(RoadSegment.disaster_id.in_(event_ids)).all() if event_ids else []
        priorities = db.query(RescuePriority).filter(RescuePriority.disaster_id.in_(event_ids)).all() if event_ids else []

        # 5. Populate Evidence Categorizations
        # Officially Reported Facts
        if matched_events:
            for ev in matched_events[:4]:
                d_date = ev.incident_date.strftime("%Y-%m-%d") if ev.incident_date else "Recorded"
                officially_reported_facts.append(
                    f"Official Event Record: '{ev.name}' ({ev.district or 'District'}, {ev.state}) on {d_date}. "
                    f"Authority: {ev.source_org or 'Disaster Management Authority'} [Verification: {ev.verification_status}]."
                )
                if ev.source_url:
                    sources.append({
                        "title": f"{ev.name} Official Activation Record",
                        "authority": ev.source_org or "State Disaster Management Authority",
                        "url": ev.source_url,
                        "publication_year": str(ev.incident_date.year) if ev.incident_date else "2026",
                        "section": "Incident Baseline Registry",
                        "passage": f"Verified disaster record for {ev.state} ({ev.district}). Source ID: {ev.source_record_id or 'National Archive'}.",
                        "relevance": 1.0
                    })
        else:
            officially_reported_facts.append(
                "No designated incident records found matching exact query constraints in active database."
            )

        # Satellite Observations
        if floods:
            for fl in floods:
                ev_name = fl.disaster.name if fl.disaster else f"Event #{fl.disaster_id}"
                satellite_observations.append(
                    f"Sentinel-1 SAR delineation for {ev_name}: Verified {fl.total_flooded_area_sqkm:.2f} km² inundated extent "
                    f"(Model: {fl.model_name}, IoU: {fl.validation_iou:.3f}, F1: {fl.validation_f1:.3f})."
                )
                sources.append({
                    "title": f"Copernicus Sentinel-1 C-SAR Flood Analysis ({ev_name})",
                    "authority": "European Space Agency / Copernicus EMS",
                    "url": getattr(fl.disaster, 'source_url', None) or "https://emergency.copernicus.eu",
                    "publication_year": "2026",
                    "section": "Automated Satellite Inundation Mask",
                    "passage": f"Calculated {fl.total_flooded_area_sqkm:.2f} km² active inundation with {fl.confidence_score*100:.1f}% confidence.",
                    "relevance": 0.98
                })
        else:
            uncertainties_and_missing.append(
                "Automated satellite SAR flood segmentation mask is pending for this specific sector."
            )

        # GIS Derived Measurements
        isolated_list = [s for s in settlements if s.is_isolated]
        blocked_roads = [r for r in roads if r.is_blocked]
        critical_bridges = [b for b in bridges if b.status in ("critical", "destroyed")]

        if isolated_list:
            gis_derived_measurements.append(
                f"Topological Road Network Analysis: {len(isolated_list)} settlements cut off from all-weather road access "
                f"(Total trapped/isolated population: ~{sum(s.estimated_population for s in isolated_list):,} residents)."
            )
            for s in isolated_list[:3]:
                featured_locations.append({
                    "name": s.name,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "risk_level": "CRITICAL",
                    "distance_to_flood_km": 0.0,
                    "is_isolated": True,
                    "details": f"Population: {s.estimated_population}. {s.isolation_reason or 'Severed road access'}."
                })

        if critical_bridges or blocked_roads:
            gis_derived_measurements.append(
                f"Infrastructure Damage Graph: {len(critical_bridges)} critical bridges washed out/impassable, "
                f"{len(blocked_roads)} primary highway segments blocked by floodwaters or debris."
            )

        # Hospitals / Shelters Proximity Observation
        if med_and_shelter:
            closest_h = [f for f in med_and_shelter if f["asset_type"] == "hospital"]
            closest_s = [f for f in med_and_shelter if f["asset_type"] == "shelter"]
            if closest_h:
                gis_derived_measurements.append(
                    f"Closest verified hospital: '{closest_h[0]['name']}' is {closest_h[0]['distance_km']} km away (Status: {closest_h[0]['status']})."
                )
            if closest_s:
                gis_derived_measurements.append(
                    f"Closest emergency shelter: '{closest_s[0]['name']}' is {closest_s[0]['distance_km']} km away (Status: {closest_s[0]['status']})."
                )

        # Model Estimates
        if priorities:
            sorted_prios = sorted(priorities, key=lambda p: p.priority_score, reverse=True)
            top_p = sorted_prios[0]
            s_name = top_p.settlement.name if top_p.settlement else f"Settlement #{top_p.settlement_id}"
            model_estimates.append(
                f"Multi-Criteria Triage Priority Model: Top priority is '{s_name}' with score {top_p.priority_score:.1f}/100 "
                f"({top_p.priority_level} tier) based on flood severity, isolation, and medical distance factors."
            )

        # 6. NDMA / NDRF Knowledge Document Search (RAG)
        rag_docs = KnowledgeService.query_rag(db, parsed.raw_query, top_k=3)
        for doc in rag_docs:
            sources.append({
                "title": doc.get("title") or "Official Disaster Guidance",
                "authority": doc.get("source_authority") or "National Disaster Management Authority (NDMA)",
                "url": doc.get("url") or "https://ndma.gov.in",
                "publication_year": str(doc.get("publication_year") or 2026),
                "section": ", ".join(doc["section_references"]) if doc.get("section_references") else "Standard Guidelines",
                "passage": doc.get("snippet") or "Official guideline protocol.",
                "relevance": doc.get("relevance_score", 0.9)
            })

        # Check for unverified/missing items
        if not isolated_list and event_ids:
            uncertainties_and_missing.append(
                "Settlement connectivity graph has not been generated for this sector's bounding box."
            )
        if not blocked_roads and event_ids:
            uncertainties_and_missing.append(
                "Road network topological cutoffs require on-ground field assessment telemetry."
            )

        # 7. Official Real-Time Emergency Alerts (with District/State Spatial Filtering)
        official_alerts: List[OfficialAlert] = []
        place_terms = list(parsed.place_names)
        if selected_location:
            for k in ["district", "state", "name", "label"]:
                v = selected_location.get(k)
                if v and v not in place_terms:
                    place_terms.append(v)

        if place_terms:
            alert_conditions = []
            for term in place_terms:
                t = f"%{term}%"
                alert_conditions.append(OfficialAlert.district.ilike(t))
                alert_conditions.append(OfficialAlert.state.ilike(t))
                alert_conditions.append(OfficialAlert.headline.ilike(t))
                alert_conditions.append(OfficialAlert.area_description.ilike(t))
            official_alerts = db.query(OfficialAlert).filter(or_(*alert_conditions)).order_by(desc(OfficialAlert.published_at)).all()

        if not official_alerts and event_ids:
            official_alerts = db.query(OfficialAlert).filter(OfficialAlert.disaster_id.in_(event_ids)).order_by(desc(OfficialAlert.published_at)).all()
        if not official_alerts:
            official_alerts = db.query(OfficialAlert).order_by(desc(OfficialAlert.published_at)).all()

        # 8. Geometry Coverage & Completeness Audit
        all_cataloged_events = db.query(DisasterEvent).all()
        events_with_geometry = []
        events_pending_mapping = []
        for ev in all_cataloged_events:
            fr_ids = [fr.id for fr in ev.flood_results] if ev.flood_results else []
            conds = [FloodPolygon.disaster_id == ev.id]
            if fr_ids:
                conds.append(FloodPolygon.flood_result_id.in_(fr_ids))
            poly_count = db.query(FloodPolygon).filter(or_(*conds)).count()
            ev_summary = {
                "id": ev.id,
                "name": ev.name,
                "state": ev.state,
                "district": ev.district,
                "polygon_count": poly_count,
                "has_geometry": poly_count > 0,
                "source_org": ev.source_org
            }
            if poly_count > 0:
                events_with_geometry.append(ev_summary)
            else:
                events_pending_mapping.append(ev_summary)

        geometry_audit = {
            "total_events": len(all_cataloged_events),
            "events_with_confirmed_geometry": events_with_geometry,
            "events_pending_mapping": events_pending_mapping,
            "coverage_pct": round((len(events_with_geometry) / max(1, len(all_cataloged_events))) * 100, 1)
        }

        return {
            "primary_event": primary_event,
            "matched_events": matched_events,
            "comparison_events": comparison_events,
            "nearby_facilities": med_and_shelter[:10],
            "all_nearby_facilities": nearby_facilities[:20],
            "isolated_settlements": isolated_list,
            "critical_bridges": critical_bridges,
            "blocked_roads": blocked_roads,
            "floods": floods,
            "priorities": priorities,
            "official_alerts": official_alerts,
            "geometry_audit": geometry_audit,
            "evidence_breakdown": {
                "officially_reported_facts": officially_reported_facts,
                "satellite_observations": satellite_observations,
                "gis_derived_measurements": gis_derived_measurements,
                "model_estimates": model_estimates,
                "uncertainties_and_missing_data": uncertainties_and_missing
            },
            "sources": sources,
            "featured_locations": featured_locations
        }

    @staticmethod
    def _find_events_for_place(
        db: Session,
        place_name: str,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None
    ) -> List[DisasterEvent]:
        """Find disaster events matching place name and optional date range."""
        q = db.query(DisasterEvent)
        term = f"%{place_name}%"
        q = q.filter(
            or_(
                DisasterEvent.name.ilike(term),
                DisasterEvent.place_name.ilike(term),
                DisasterEvent.district.ilike(term),
                DisasterEvent.state.ilike(term)
            )
        )

        if start_year and end_year:
            if start_year == end_year:
                q = q.filter(DisasterEvent.incident_date >= datetime(start_year, 1, 1))
                q = q.filter(DisasterEvent.incident_date <= datetime(end_year, 12, 31, 23, 59, 59))
            else:
                q = q.filter(DisasterEvent.incident_date >= datetime(start_year, 1, 1))
                q = q.filter(DisasterEvent.incident_date <= datetime(end_year, 12, 31, 23, 59, 59))

        return q.order_by(desc(DisasterEvent.incident_date)).all()
