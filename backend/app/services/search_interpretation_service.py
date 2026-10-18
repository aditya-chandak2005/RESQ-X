"""Search Interpretation Service for RESQ-X.
Parses natural language place and disaster queries into structured geospatial operations,
administrative context, temporal ranges (defaulting to rolling 10-year window),
and intent classifications (locate, summarize, compare, visualize, report).
"""
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.app.schemas.schemas import SearchInterpretResponse, GeocodingPlace
from backend.app.services.geocoding_service import GeocodingService, CURATED_PLACES
from backend.app.services.incident_service import IncidentService
from backend.app.models.models import DisasterEvent


class SearchInterpretationService:
    """Interprets free-text queries to guide the search, map, Copilot, and archive coordinate system."""

    @staticmethod
    def interpret_query(
        query: str,
        current_place_id: Optional[str] = None,
        current_incident_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """Parse natural language query and return structured search interpretation."""
        raw_query = (query or "").strip()
        q_lower = raw_query.lower()

        # 1. Detect Operation Intent
        operation = "locate"
        if any(w in q_lower for w in ["compare", "difference between", "versus", " vs "]):
            operation = "compare"
        elif any(w in q_lower for w in ["visualize", "show map", "show footprint", "display polygons", "overlay"]):
            operation = "visualize"
        elif any(w in q_lower for w in ["report", "sitrep", "generate report", "situation report", "export"]):
            operation = "report"
        elif any(w in q_lower for w in ["summarize", "summary", "history", "past floods", "tell me about", "what happened"]):
            operation = "summarize"
        else:
            operation = "locate"

        # 2. Extract Temporal Date / Year Tokens
        year_matches = [int(y) for y in re.findall(r'\b(19\d\d|20\d\d)\b', raw_query)]
        current_year = 2026
        rolling_start_year = current_year - 10 # 2016

        date_range: Dict[str, Any] = {}
        if len(year_matches) >= 2:
            y_min = min(year_matches)
            y_max = max(year_matches)
            date_range = {
                "start_year": y_min,
                "end_year": y_max,
                "start_date": f"{y_min}-01-01T00:00:00",
                "end_date": f"{y_max}-12-31T23:59:59",
                "label": f"Historical Range ({y_min}–{y_max})",
                "is_rolling_10_year": False,
                "years": year_matches
            }
        elif len(year_matches) == 1:
            y = year_matches[0]
            date_range = {
                "start_year": y,
                "end_year": y,
                "start_date": f"{y}-01-01T00:00:00",
                "end_date": f"{y}-12-31T23:59:59",
                "label": f"Calendar Year {y}",
                "is_rolling_10_year": False,
                "years": [y]
            }
        else:
            # Default to rolling 10-year window: Oct 18, 2016 – Oct 18, 2026
            date_range = {
                "start_year": rolling_start_year,
                "end_year": current_year,
                "start_date": f"{rolling_start_year}-10-18T00:00:00",
                "end_date": f"{current_year}-10-18T23:59:59",
                "label": f"10-Year Rolling Window ({rolling_start_year}–{current_year})",
                "is_rolling_10_year": True,
                "years": list(range(rolling_start_year, current_year + 1))
            }

        # 3. Detect Hazard Type
        hazard_type = "flood"
        if any(w in q_lower for w in ["landslide", "debris flow", "rockfall"]):
            hazard_type = "landslide"
        elif any(w in q_lower for w in ["flash flood", "cloudburst", "outburst", "glof"]):
            hazard_type = "flash_flood"
        elif any(w in q_lower for w in ["urban flood", "waterlogging", "deluge", "drainage"]):
            hazard_type = "urban_flood"
        elif any(w in q_lower for w in ["riverine flood", "river flood", "embankment breach", "dyke breach"]):
            hazard_type = "riverine_flood"

        # 4. Resolve Place
        # Clean place search query by stripping common stopwords and year strings
        clean_place_q = re.sub(r'\b(19\d\d|20\d\d)\b', ' ', raw_query)
        for stop_term in ["floods in", "flood in", "landslides in", "landslide in", "compare", "versus", " vs ", "history of", "tell me about", "show map of", "visualize", "summary of"]:
            clean_place_q = re.sub(re.escape(stop_term), ' ', clean_place_q, flags=re.IGNORECASE)
        clean_place_q = clean_place_q.strip()
        if not clean_place_q:
            clean_place_q = raw_query

        resolved_place: Optional[Dict[str, Any]] = None
        if current_place_id:
            resolved_place = GeocodingService.get_place_by_id(current_place_id)

        if not resolved_place:
            geocode_resp = GeocodingService.search_places(clean_place_q if len(clean_place_q) >= 2 else raw_query, limit=3)
            places_found = geocode_resp.get("places", [])
            if places_found:
                resolved_place = places_found[0]

        place_name = resolved_place.get("name") if resolved_place else clean_place_q
        admin_level = resolved_place.get("feature_type", "locality") if resolved_place else "locality"

        # 5. Query matching incidents from Database
        matched_incidents: List[Dict[str, Any]] = []
        if db:
            q_inc = db.query(DisasterEvent)
            
            # Match specific place first, then broader state
            specific_conditions = []
            state_conditions = []
            if resolved_place:
                if resolved_place.get("name") and resolved_place.get("name").lower() not in ["india", "all"]:
                    specific_conditions.append(DisasterEvent.place_name.ilike(f"%{resolved_place['name']}%"))
                    specific_conditions.append(DisasterEvent.name.ilike(f"%{resolved_place['name']}%"))
                if resolved_place.get("district"):
                    specific_conditions.append(DisasterEvent.district.ilike(f"%{resolved_place['district']}%"))
                if resolved_place.get("state"):
                    state_conditions.append(DisasterEvent.state.ilike(f"%{resolved_place['state']}%"))
            else:
                loc_term = f"%{clean_place_q}%"
                specific_conditions.extend([
                    DisasterEvent.place_name.ilike(loc_term),
                    DisasterEvent.name.ilike(loc_term),
                    DisasterEvent.district.ilike(loc_term)
                ])
                state_conditions.append(DisasterEvent.state.ilike(loc_term))

            loc_filter = or_(*specific_conditions) if specific_conditions else (or_(*state_conditions) if state_conditions else None)

            # Apply temporal filter
            if "start_year" in date_range and not date_range.get("is_rolling_10_year", False):
                q_inc = q_inc.filter(DisasterEvent.incident_date >= datetime(date_range["start_year"], 1, 1))
                q_inc = q_inc.filter(DisasterEvent.incident_date <= datetime(date_range["end_year"], 12, 31, 23, 59, 59))
                if loc_filter is not None:
                    q_inc = q_inc.filter(loc_filter)
                items = q_inc.order_by(desc(DisasterEvent.incident_date)).all()
            elif date_range.get("is_rolling_10_year"):
                # Rolling 10-year window
                q_window = q_inc.filter(
                    DisasterEvent.incident_date >= datetime(rolling_start_year, 10, 18),
                    DisasterEvent.incident_date <= datetime(current_year, 10, 18, 23, 59, 59)
                )
                if loc_filter is not None:
                    q_window = q_window.filter(loc_filter)
                items = q_window.order_by(desc(DisasterEvent.incident_date)).all()

                # If no items found within 10-year window, search full historical archive for this place
                if not items:
                    q_archive = db.query(DisasterEvent)
                    if loc_filter is not None:
                        q_archive = q_archive.filter(loc_filter)
                    items = q_archive.order_by(desc(DisasterEvent.incident_date)).all()
            else:
                if loc_filter is not None:
                    q_inc = q_inc.filter(loc_filter)
                items = q_inc.order_by(desc(DisasterEvent.incident_date)).all()
            for it in items:
                matched_incidents.append(IncidentService._serialize_incident(it, db))

        # 6. Intent Summary & Suggested Actions
        intent_parts = []
        if operation == "locate":
            intent_parts.append(f"Stage A: Establish geographic boundary for {place_name} ({admin_level})")
        elif operation == "compare":
            intent_parts.append(f"Compare historical flood consequence metrics for {place_name} between {', '.join(map(str, date_range.get('years', [])))}")
        elif operation == "visualize":
            intent_parts.append(f"Stage B: Render verified geospatial flood extent and footprint for {place_name}")
        elif operation == "report":
            intent_parts.append(f"Synthesize comprehensive disaster Situation Report (SITREP) for {place_name}")
        else:
            intent_parts.append(f"Retrieve {date_range.get('label')} disaster intelligence for {place_name}")

        suggested_actions = []
        if matched_incidents:
            first_inc = matched_incidents[0]
            suggested_actions.append(f"Visualize {first_inc['name']} on Map")
            suggested_actions.append(f"Show 10-Year Aggregated Flood Footprint for {place_name}")
            suggested_actions.append(f"Ask Copilot: Why were the historical floods in {place_name} so catastrophic?")
            suggested_actions.append("Inspect Evidence Provenance (ASDMA, NDMA, CWC)")
            suggested_actions.append(f"Generate Situation Report for {first_inc['name']}")
        else:
            suggested_actions.append(f"Zoom map to {place_name} administrative boundary")
            suggested_actions.append(f"Ask Copilot about disaster risk profile of {place_name}")
            suggested_actions.append("Search related districts or rivers")

        # 7. Fetch 10-year historical summary for resolved place
        historical_summary = None
        if resolved_place and db and resolved_place.get("place_id"):
            try:
                y_from = date_range.get("start_year") if not date_range.get("is_rolling_10_year") else None
                y_to = date_range.get("end_year") if not date_range.get("is_rolling_10_year") else None
                historical_summary = IncidentService.get_historical_floods_by_place(
                    db=db,
                    place_id=resolved_place["place_id"],
                    year_from=y_from,
                    year_to=y_to,
                    window_years=10
                )
            except Exception as e:
                pass

        return {
            "query": raw_query,
            "place_name": place_name,
            "administrative_level": admin_level,
            "hazard_type": hazard_type,
            "date_range": date_range,
            "incident_name": matched_incidents[0]["name"] if matched_incidents else None,
            "operation": operation,
            "resolved_place": resolved_place,
            "matched_incidents": matched_incidents,
            "intent_summary": " • ".join(intent_parts),
            "suggested_actions": suggested_actions,
            "historical_summary": historical_summary
        }
