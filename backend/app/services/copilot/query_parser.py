"""Natural-Language Disaster Query Entity & Constraint Parser for RESQ Copilot.
Extracts places, admin levels, hazard types, temporal windows, requested metrics, and operational intent.
"""
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field

from backend.app.services.geocoding_service import CURATED_PLACES


KNOWN_HAZARDS = {
    "glacial_lake_flash_flood": ["glof", "glacial outburst", "glacial lake", "debris avalanche", "rock avalanche"],
    "flash_flood": ["flash flood", "flash floods", "cloudburst", "torrential surge", "flash inundation"],
    "urban_flood": ["urban flood", "urban flooding", "deluge", "waterlogging", "stormwater", "drainage failure"],
    "riverine_flood": ["riverine flood", "river flood", "embankment breach", "dyke breach", "dyke", "bund breach", "river surge"],
    "landslide": ["landslide", "landslides", "slope failure", "mudslide", "rockfall"],
    "flood": ["flood", "floods", "flooding", "inundation", "high water"]
}

KNOWN_METRICS = {
    "hospitals_shelters": ["hospital", "hospitals", "shelter", "shelters", "clinic", "clinics", "health centre", "trauma center", "medical facility"],
    "roads_bridges": ["road", "roads", "bridge", "bridges", "highway", "span", "culvert", "blocked", "severed", "impassable", "washout", "washed away"],
    "isolated_settlements": ["village", "villages", "hamlet", "hamlets", "settlement", "settlements", "cut off", "stranded", "isolated", "trapped"],
    "fatalities_displacement": ["death", "deaths", "fatality", "fatalities", "casualty", "casualties", "dead", "displaced", "displacement", "evacuated"],
    "flood_extent": ["extent", "area", "sqkm", "square kilometer", "square km", "hectares", "footprint", "water surface", "sar"],
    "official_reports": ["report", "reports", "official report", "sitrep", "situation report", "emsr", "bulletin", "rapid mapping"],
    "damage_missing_data": ["verified damage", "missing information", "uncertainties", "uncertain", "missing data", "data quality", "limitations", "unverified"]
}


@dataclass
class ParsedDisasterQuery:
    raw_query: str
    normalized_query: str
    places: List[Dict[str, Any]] = field(default_factory=list)
    place_names: List[str] = field(default_factory=list)
    uses_selected_location: bool = False
    is_comparison: bool = False
    comparison_places: List[str] = field(default_factory=list)
    hazard_types: List[str] = field(default_factory=list)
    primary_hazard: str = "flood"
    years: List[int] = field(default_factory=list)
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_rolling_10_year: bool = False
    metrics_requested: List[str] = field(default_factory=list)
    intent: str = "general_inquiry" # comparison, timeline_history, nearby_facilities, infrastructure_damage, isolated_settlements, event_investigation, official_reports, data_quality_audit, guidelines_rag, general_inquiry
    is_ambiguous: bool = False
    disambiguation_candidates: List[Dict[str, Any]] = field(default_factory=list)

    @property
    def place(self) -> Optional[str]:
        return self.place_names[0] if self.place_names else None

    @property
    def hazard_type(self) -> str:
        return self.primary_hazard

    @property
    def temporal_start(self) -> Optional[int]:
        return self.start_year

    @property
    def temporal_end(self) -> Optional[int]:
        return self.end_year

    @property
    def place_ref_context(self) -> bool:
        return self.uses_selected_location

    @property
    def comparison_target(self) -> Optional[str]:
        return self.comparison_places[1] if len(self.comparison_places) > 1 else (self.comparison_places[0] if self.comparison_places else None)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_query": self.raw_query,
            "places": self.place_names,
            "uses_selected_location": self.uses_selected_location,
            "is_comparison": self.is_comparison,
            "comparison_places": self.comparison_places,
            "primary_hazard": self.primary_hazard,
            "years": self.years,
            "start_year": self.start_year,
            "end_year": self.end_year,
            "is_rolling_10_year": self.is_rolling_10_year,
            "metrics_requested": self.metrics_requested,
            "intent": self.intent,
            "is_ambiguous": self.is_ambiguous
        }


class CopilotQueryParser:
    """Parses natural-language disaster queries into structured entities and constraints."""

    @classmethod
    def parse(
        cls,
        query: str,
        selected_location: Optional[Dict[str, Any]] = None,
        mode: str = "selected_location"
    ) -> ParsedDisasterQuery:
        raw = (query or "").strip()
        q_clean = raw.lower()

        # 1. Detect relative reference to active selection
        uses_selected_loc = False
        relative_patterns = [
            r"\bthis district\b", r"\bthis place\b", r"\bthis location\b",
            r"\bselected location\b", r"\bcurrent location\b", r"\bhere\b",
            r"\bthis sector\b", r"\bthis area\b", r"\bthe selected\b"
        ]
        for pat in relative_patterns:
            if re.search(pat, q_clean):
                uses_selected_loc = True
                break

        # 2. Extract Place Mentions
        found_places: List[Dict[str, Any]] = []
        found_names: List[str] = []

        # Check curated place names and aliases
        for cp in CURATED_PLACES:
            name_lower = cp["name"].lower()
            # Word boundary check for place name
            if re.search(rf"\b{re.escape(name_lower)}\b", q_clean):
                if cp["name"] not in found_names:
                    found_places.append(cp)
                    found_names.append(cp["name"])

        # Also check additional known disaster districts & cities in India
        extra_places = {
            "mumbai": {"name": "Mumbai", "district": "Mumbai Suburban", "state": "Maharashtra", "feature_type": "city", "latitude": 19.0760, "longitude": 72.8777},
            "guwahati": {"name": "Guwahati", "district": "Kamrup Metropolitan", "state": "Assam", "feature_type": "city", "latitude": 26.1445, "longitude": 91.7362},
            "silchar": {"name": "Silchar", "district": "Cachar", "state": "Assam", "feature_type": "city", "latitude": 24.8333, "longitude": 92.7789},
            "chamoli": {"name": "Chamoli", "district": "Chamoli", "state": "Uttarakhand", "feature_type": "district", "latitude": 30.4000, "longitude": 79.3500},
            "raini": {"name": "Raini", "district": "Chamoli", "state": "Uttarakhand", "feature_type": "village", "latitude": 30.4912, "longitude": 79.6841},
            "tapovan": {"name": "Tapovan", "district": "Chamoli", "state": "Uttarakhand", "feature_type": "locality", "latitude": 30.4945, "longitude": 79.6278},
            "joshimath": {"name": "Joshimath", "district": "Chamoli", "state": "Uttarakhand", "feature_type": "town", "latitude": 30.5564, "longitude": 79.5645},
            "pipalkoti": {"name": "Pipalkoti", "district": "Chamoli", "state": "Uttarakhand", "feature_type": "town", "latitude": 30.4280, "longitude": 79.4320},
            "chiplun": {"name": "Chiplun", "district": "Ratnagiri", "state": "Maharashtra", "feature_type": "city", "latitude": 17.5323, "longitude": 73.5186},
            "mandi": {"name": "Mandi", "district": "Mandi", "state": "Himachal Pradesh", "feature_type": "district", "latitude": 31.5892, "longitude": 76.9182},
            "himachal pradesh": {"name": "Himachal Pradesh", "district": None, "state": "Himachal Pradesh", "feature_type": "state", "latitude": 31.1048, "longitude": 77.1734},
            "kerala": {"name": "Kerala", "district": None, "state": "Kerala", "feature_type": "state", "latitude": 10.8505, "longitude": 76.2711},
            "idukki": {"name": "Idukki", "district": "Idukki", "state": "Kerala", "feature_type": "district", "latitude": 9.8494, "longitude": 76.9806},
            "ernakulam": {"name": "Ernakulam", "district": "Ernakulam", "state": "Kerala", "feature_type": "district", "latitude": 9.9816, "longitude": 76.2999},
            "barpeta": {"name": "Barpeta", "district": "Barpeta", "state": "Assam", "feature_type": "district", "latitude": 26.3200, "longitude": 91.0000},
            "golaghat": {"name": "Golaghat", "district": "Golaghat", "state": "Assam", "feature_type": "district", "latitude": 26.5200, "longitude": 93.9700},
            "kaziranga": {"name": "Kaziranga", "district": "Golaghat", "state": "Assam", "feature_type": "locality", "latitude": 26.5775, "longitude": 93.1711},
            "nagaon": {"name": "Nagaon", "district": "Nagaon", "state": "Assam", "feature_type": "district", "latitude": 26.3500, "longitude": 92.6800},
            "hojai": {"name": "Hojai", "district": "Hojai", "state": "Assam", "feature_type": "district", "latitude": 26.0000, "longitude": 92.8500},
            "morigaon": {"name": "Morigaon", "district": "Morigaon", "state": "Assam", "feature_type": "district", "latitude": 26.2500, "longitude": 92.3400},
            "dhemaji": {"name": "Dhemaji", "district": "Dhemaji", "state": "Assam", "feature_type": "district", "latitude": 27.4800, "longitude": 94.5800},
            "karimganj": {"name": "Karimganj", "district": "Karimganj", "state": "Assam", "feature_type": "district", "latitude": 24.8700, "longitude": 92.3500},
        }

        for place_key, p_meta in extra_places.items():
            if re.search(rf"\b{re.escape(place_key)}\b", q_clean):
                if p_meta["name"] not in found_names:
                    found_places.append(p_meta)
                    found_names.append(p_meta["name"])

        # If user explicitly references "this district/place" and selected_location is provided
        if (uses_selected_loc or (mode == "selected_location" and not found_places)) and selected_location:
            sel_name = selected_location.get("label") or selected_location.get("name") or "Selected Location"
            if sel_name not in found_names:
                loc_obj = {
                    "name": sel_name,
                    "district": selected_location.get("district"),
                    "state": selected_location.get("state"),
                    "feature_type": "selected_poi",
                    "latitude": selected_location.get("lat") or selected_location.get("latitude"),
                    "longitude": selected_location.get("lng") or selected_location.get("longitude")
                }
                found_places.insert(0, loc_obj)
                found_names.insert(0, sel_name)
                uses_selected_loc = True

        # 3. Detect Comparison Intent
        is_comparison = False
        comparison_places: List[str] = []
        compare_tokens = ["compare", "comparison", "versus", " vs ", "difference between", "contrasting", "relative to"]
        has_compare_keyword = any(tok in q_clean for tok in compare_tokens)

        # 4. Extract Temporal Constraints
        year_matches = [int(y) for y in re.findall(r"\b(19\d\d|20\d\d)\b", raw)]
        is_10_year = bool(re.search(r"\b(10\s*years?|decade|ten\s*years?)\b", q_clean))
        is_5_year = bool(re.search(r"\b(5\s*years?|five\s*years?)\b", q_clean))

        start_year: Optional[int] = None
        end_year: Optional[int] = None
        CURRENT_YEAR = 2026

        if len(year_matches) >= 2:
            start_year = min(year_matches)
            end_year = max(year_matches)
        elif len(year_matches) == 1:
            start_year = year_matches[0]
            end_year = year_matches[0]
        elif is_10_year:
            start_year = CURRENT_YEAR - 10 # 2016
            end_year = CURRENT_YEAR
        elif is_5_year:
            start_year = CURRENT_YEAR - 5
            end_year = CURRENT_YEAR

        if has_compare_keyword or len(found_names) >= 2:
            if len(found_names) >= 2:
                is_comparison = True
                comparison_places = found_names[:2]
            elif has_compare_keyword and len(year_matches) >= 2:
                is_comparison = True
                p_label = found_names[0] if found_names else (selected_location.get("label") if selected_location else "Assam")
                comparison_places = [f"{p_label} ({year_matches[0]})", f"{p_label} ({year_matches[1]})"]
            elif has_compare_keyword and len(found_names) == 1 and selected_location:
                sel_n = selected_location.get("label") or selected_location.get("name") or "Selected Location"
                if sel_n.lower() != found_names[0].lower():
                    is_comparison = True
                    comparison_places = [found_names[0], sel_n]
            elif has_compare_keyword:
                is_comparison = True
                p_label = found_names[0] if found_names else (selected_location.get("label") if selected_location else "Assam")
                comparison_places = [f"{p_label} (Current/Recent)", f"{p_label} (Historical Baseline)"]

        # 5. Extract Hazard Type
        detected_hazards = []
        primary_hazard = "flood"
        for h_type, patterns in KNOWN_HAZARDS.items():
            for pat in patterns:
                if pat in q_clean:
                    if h_type not in detected_hazards:
                        detected_hazards.append(h_type)
                    primary_hazard = h_type
                    break
        if not detected_hazards:
            detected_hazards = ["flood"]

        # 6. Extract Requested Metrics & Evidence
        metrics_requested = []
        for m_cat, keywords in KNOWN_METRICS.items():
            for kw in keywords:
                if kw in q_clean:
                    metrics_requested.append(m_cat)
                    break

        # 7. Classify Operational Intent
        is_active_alert_query = any(w in q_clean for w in [
            "active alert", "active warning", "current warning", "current alert",
            "red alert", "orange alert", "yellow alert", "sachet", "warnings vs historical",
            "current vs historical", "distinguish historical", "active emergencies",
            "active disaster", "live alert", "alerts have been issued", "official alerts",
            "disaster alerts", "recent alerts", "official disaster alerts"
        ])

        is_geometry_status_query = any(w in q_clean for w in [
            "confirmed affected-area geometry", "confirmed geometry", "verified geometry",
            "incomplete mapping", "missing mapping", "pending analysis", "geometry status",
            "which events have incomplete", "confirmed affected area", "which incidents have confirmed",
            "confirmed affected extent", "incomplete flood mapping"
        ])

        if is_comparison:
            intent = "comparison"
        elif is_geometry_status_query:
            intent = "geometry_coverage_audit"
        elif is_active_alert_query:
            intent = "active_alerts_vs_history"
        elif "hospitals_shelters" in metrics_requested or any(w in q_clean for w in ["hospitals near", "shelters near", "near this", "nearby"]):
            intent = "nearby_facilities"
        elif "roads_bridges" in metrics_requested or "isolated_settlements" in metrics_requested or any(w in q_clean for w in ["cut off", "blocked", "isolated", "severed", "infrastructure lies", "infrastructure inside", "inside the verified"]):
            intent = "infrastructure_damage"
        elif is_10_year or any(w in q_clean for w in ["historical floods", "history", "timeline", "past events", "recurrence", "what historical floods"]):
            intent = "timeline_history"
        elif "official_reports" in metrics_requested or any(w in q_clean for w in ["official report", "find official reports", "sitrep", "emsr"]):
            intent = "official_reports"
        elif "damage_missing_data" in metrics_requested or any(w in q_clean for w in ["verified damage", "missing information", "uncertainties", "identify missing"]):
            intent = "data_quality_audit"
        elif year_matches and any(w in q_clean for w in ["what happened", "incident", "flood in", "disaster in"]):
            intent = "event_investigation"
        elif any(w in q_clean for w in ["protocol", "sop", "guideline", "first aid", "hypothermia", "landing zone", "how to"]):
            intent = "guidelines_rag"
        else:
            intent = "general_inquiry"

        # 8. Ambiguity Detection
        is_ambiguous = False
        candidates: List[Dict[str, Any]] = []
        # If user queried something like "floods in this state" without specifying and no selection
        if any(w in q_clean for w in ["which state", "which district", "some district"]) and not found_places:
            is_ambiguous = True
            candidates = [
                {"name": "Assam", "state": "Assam", "district": None, "type": "State (Brahmaputra / Barak basin)"},
                {"name": "Chamoli", "state": "Uttarakhand", "district": "Chamoli", "type": "Himalayan Gorge Sector"},
                {"name": "Mumbai Suburban", "state": "Maharashtra", "district": "Mumbai Suburban", "type": "Metropolitan Basin"}
            ]

        return ParsedDisasterQuery(
            raw_query=raw,
            normalized_query=q_clean,
            places=found_places,
            place_names=found_names,
            uses_selected_location=uses_selected_loc,
            is_comparison=is_comparison,
            comparison_places=comparison_places,
            hazard_types=detected_hazards,
            primary_hazard=primary_hazard,
            years=year_matches,
            start_year=start_year,
            end_year=end_year,
            is_rolling_10_year=is_10_year,
            metrics_requested=metrics_requested,
            intent=intent,
            is_ambiguous=is_ambiguous,
            disambiguation_candidates=candidates
        )
