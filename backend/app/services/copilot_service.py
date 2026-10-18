"""Copilot Service: Disaster-specialized intelligence agent with database facts and RAG integration.
Supports natural-language parsing, location-aware modes, multi-source retrieval, and staged responses.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import time

from backend.app.services.copilot.copilot import ResqCopilot
from backend.app.services.copilot.query_parser import CopilotQueryParser
from backend.app.services.copilot.retrieval_pipeline import CopilotRetrievalPipeline
from backend.app.services.copilot.synthesis_engine import CopilotSynthesisEngine
from backend.app.models.models import CopilotQuery, DisasterEvent


class CopilotService:
    @staticmethod
    def ask(
        db: Session,
        query: str,
        disaster_id: Optional[int] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        selected_location: Optional[Dict[str, Any]] = None,
        mode: str = "selected_location",
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process natural language question through parsed constraints, grounded retrieval, and synthesis."""
        t_start = time.time()
        generated_at = datetime.now(timezone.utc).isoformat()

        # 1. Parse natural language query
        parsed = CopilotQueryParser.parse(
            query=query,
            selected_location=selected_location,
            mode=mode
        )

        # 2. Execute multi-source retrieval pipeline
        evidence = CopilotRetrievalPipeline.execute(
            db=db,
            parsed=parsed,
            disaster_id=disaster_id,
            selected_location=selected_location,
            mode=mode
        )
        t_retrieval = (time.time() - t_start) * 1000

        # 3. Grounded answer synthesis
        t_synth_start = time.time()
        synth = CopilotSynthesisEngine.synthesize(
            db=db,
            parsed=parsed,
            evidence=evidence,
            selected_location=selected_location,
            mode=mode
        )
        t_synthesis = (time.time() - t_synth_start) * 1000
        t_total = (time.time() - t_start) * 1000

        primary_ev = evidence.get("primary_event")
        incident_id = primary_ev.id if primary_ev else disaster_id
        incident_name = primary_ev.name if primary_ev else (selected_location.get("label") if selected_location else "National Monitoring")

        floods = evidence.get("floods", [])
        total_fl_area = round(floods[0].total_flooded_area_sqkm, 2) if floods else (primary_ev.flooded_area_sqkm if primary_ev else None)

        isolated_list = evidence.get("isolated_settlements", [])
        isolated_pop = sum(s.estimated_population for s in isolated_list if getattr(s, 'estimated_population', None))

        data_used = {
            "disaster_id": incident_id,
            "disaster_name": incident_name,
            "places": parsed.place_names,
            "primary_hazard": parsed.primary_hazard,
            "years": parsed.years,
            "total_flooded_area_sqkm": total_fl_area,
            "matched_events_count": len(evidence.get("matched_events", [])),
            "nearby_facilities_count": len(evidence.get("nearby_facilities", [])),
            "isolated_settlements_count": len(isolated_list),
            "isolated_population": isolated_pop,
            "blocked_roads_count": len(evidence.get("blocked_roads", [])),
            "critical_bridges_count": len(evidence.get("critical_bridges", []))
        }

        # Build response payload
        result = {
            "query": query,
            "response": synth["answer"],
            "answer": synth["answer"],
            "incident_id": incident_id,
            "incident_name": incident_name,
            "answer_status": synth.get("answer_status", "success"),
            "grounded_data": data_used,
            "data_used": data_used,
            "evidence_breakdown": synth.get("evidence_breakdown"),
            "matched_events": synth.get("matched_events", []),
            "nearby_facilities": synth.get("nearby_facilities", []),
            "sources": synth.get("sources", []),
            "limitations": synth.get("limitations", []),
            "suggested_queries": synth.get("suggested_follow_up", []),
            "suggested_follow_up": synth.get("suggested_follow_up", []),
            "featured_locations": synth.get("featured_locations", []),
            "model_info": synth.get("model_info"),
            "mode": mode,
            "retrieval_latency_ms": round(t_retrieval, 2),
            "synthesis_latency_ms": round(t_synthesis, 2),
            "total_latency_ms": round(t_total, 2),
            "disambiguation_candidates": parsed.disambiguation_candidates if parsed.is_ambiguous else None,
            "timestamp": generated_at,
            "generated_at": generated_at
        }

        # Safe logging to copilot_queries table
        try:
            log = CopilotQuery(
                disaster_id=incident_id or 1,
                query_text=query,
                response_text=result["answer"][:1000],
                retrieved_data_json={
                    "sources": result.get("sources", []),
                    "data_used": result.get("data_used", {}),
                    "status": result.get("answer_status", "success"),
                    "latencies_ms": {
                        "retrieval": result["retrieval_latency_ms"],
                        "synthesis": result["synthesis_latency_ms"],
                        "total": result["total_latency_ms"]
                    }
                }
            )
            db.add(log)
            db.commit()
        except Exception as e:
            db.rollback()

        return result

    @staticmethod
    def staged_search(
        db: Session,
        query: str,
        disaster_id: Optional[int] = None,
        selected_location: Optional[Dict[str, Any]] = None,
        mode: str = "selected_location"
    ) -> Dict[str, Any]:
        """High-speed staged search providing parsed constraints and matching event cards within milliseconds."""
        t_start = time.time()
        parsed = CopilotQueryParser.parse(query=query, selected_location=selected_location, mode=mode)
        evidence = CopilotRetrievalPipeline.execute(db=db, parsed=parsed, disaster_id=disaster_id, selected_location=selected_location, mode=mode)
        dt = (time.time() - t_start) * 1000

        matched_serialized = [
            IncidentService._serialize_incident(e, db) for e in evidence.get("matched_events", [])[:5]
        ]

        facilities = evidence.get("nearby_facilities", [])[:6]
        return {
            "query": query,
            "status": "staged_results_ready",
            "parsed_entities": parsed.to_dict(),
            "search_constraints": parsed.to_dict(),
            "mode": mode,
            "matched_events": matched_serialized,
            "nearby_facilities": facilities,
            "facilities": facilities,
            "sources_preview": evidence.get("sources", [])[:3],
            "retrieval_latency_ms": round(dt, 2),
            "latency_ms": round(dt, 2)
        }

    @staticmethod
    def get_quick_review(db: Session, disaster_id: int, review_type: str = "executive") -> Dict[str, Any]:
        """Generate structured quick review modules for high-speed decision making."""
        return ResqCopilot.get_quick_review(db, disaster_id, review_type)

    @staticmethod
    def get_quick_queries(
        db: Session,
        disaster_id: Optional[int] = None,
        selected_location: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve dynamic context-aware quick queries based on active incident and location availability."""
        if disaster_id and disaster_id > 0:
            return ResqCopilot.get_context_aware_quick_queries(db, disaster_id)

        # Dynamic location-specific quick queries if selected_location is provided
        loc_name = (selected_location.get("label") or selected_location.get("name") if selected_location else None) or "Active Location"
        loc_lower = loc_name.lower()

        if "assam" in loc_lower or "brahmaputra" in loc_lower or "barak" in loc_lower or "silchar" in loc_lower:
            return [
                {
                    "category": "flood_situation",
                    "category_label": "🌊 Flood Situation",
                    "label": "🌊 Assam 10-Year Flood History",
                    "query": f"Show historical floods in Assam during the last 10 years, flooded extent, and casualties.",
                    "is_available": True,
                    "badge": "10-YR ARCHIVE"
                },
                {
                    "category": "flood_situation",
                    "category_label": "🌊 Flood Situation",
                    "label": "⚖️ Compare 2020 vs 2022 Floods",
                    "query": "Compare 2020 vs 2022 floods in Assam: which had higher inundation extent and displacement?",
                    "is_available": True,
                    "badge": "COMPARATIVE"
                },
                {
                    "category": "infrastructure_exposure",
                    "category_label": "🏗️ Infrastructure & Exposure",
                    "label": "🏥 Reachable Hospitals & Shelters",
                    "query": f"What hospitals and shelters are near this selected location in {loc_name}?",
                    "is_available": True,
                    "badge": "GIS PROXIMITY"
                },
                {
                    "category": "infrastructure_exposure",
                    "category_label": "🏗️ Infrastructure & Exposure",
                    "label": "🚧 Blocked Roads & Cut-Off Hamlets",
                    "query": f"Which villages were cut off, and which roads were blocked in {loc_name}?",
                    "is_available": True,
                    "badge": "TOPOLOGY"
                },
                {
                    "category": "evidence_reporting",
                    "category_label": "📑 Evidence & Sitrep",
                    "label": "🛡️ Verified Damage & Missing Data",
                    "query": f"Summarize verified damage and identify missing information for {loc_name}.",
                    "is_available": True,
                    "badge": "DATA QUALITY"
                }
            ]
        elif "mumbai" in loc_lower or "maharashtra" in loc_lower:
            return [
                {
                    "category": "flood_situation",
                    "category_label": "🌊 Flood Situation",
                    "label": "🌊 Mumbai 2005 Deluge Genesis",
                    "query": "Explain the Mumbai 2005 flood: how the flood happened, what the causes were, how many people got affected, and the recovery response.",
                    "is_available": True,
                    "badge": "DELUGE ARCHIVE"
                },
                {
                    "category": "flood_situation",
                    "category_label": "🌊 Flood Situation",
                    "label": "⚖️ Compare Mumbai vs Guwahati",
                    "query": "Compare flood events in Mumbai and Guwahati.",
                    "is_available": True,
                    "badge": "COMPARISON"
                },
                {
                    "category": "infrastructure_exposure",
                    "category_label": "🏗️ Infrastructure & Exposure",
                    "label": "🏥 Hospitals Near Flood Corridors",
                    "query": "What hospitals and shelters are near this selected location in Mumbai?",
                    "is_available": True,
                    "badge": "GIS PROXIMITY"
                },
                {
                    "category": "infrastructure_exposure",
                    "category_label": "🏗️ Infrastructure & Exposure",
                    "label": "🚧 Mithi River Bridges & Road Cuts",
                    "query": "Which roads were blocked and which bridges were impassable across the Mithi River?",
                    "is_available": True,
                    "badge": "TOPOLOGY"
                },
                {
                    "category": "evidence_reporting",
                    "category_label": "📑 Evidence & Sitrep",
                    "label": "🛡️ Verified Damage & Missing Info",
                    "query": "Summarize verified damage and identify missing information.",
                    "is_available": True,
                    "badge": "DATA QUALITY"
                }
            ]
        else:
            return [
                {
                    "category": "flood_situation",
                    "category_label": "🌊 Flood Situation",
                    "label": "🌊 10-Year Regional Flood History",
                    "query": f"Show historical floods in {loc_name} during the last 10 years.",
                    "is_available": True,
                    "badge": "10-YR ARCHIVE"
                },
                {
                    "category": "infrastructure_exposure",
                    "category_label": "🏗️ Infrastructure & Exposure",
                    "label": "🏥 Nearby Hospitals & Shelters",
                    "query": f"What hospitals and shelters are near this selected location?",
                    "is_available": True,
                    "badge": "GIS PROXIMITY"
                },
                {
                    "category": "infrastructure_exposure",
                    "category_label": "🏗️ Infrastructure & Exposure",
                    "label": "🚧 Cut-Off Villages & Blocked Roads",
                    "query": f"Which villages were cut off, and which roads were blocked in this sector?",
                    "is_available": True,
                    "badge": "TOPOLOGY"
                },
                {
                    "category": "evidence_reporting",
                    "category_label": "📑 Evidence & Sitrep",
                    "label": "📑 Find Official Situation Reports",
                    "query": f"Find official reports for this disaster theater.",
                    "is_available": True,
                    "badge": "OFFICIAL REPORTS"
                },
                {
                    "category": "evidence_reporting",
                    "category_label": "📑 Evidence & Sitrep",
                    "label": "🛡️ Verified Damage & Missing Data",
                    "query": "Summarize verified damage and identify missing information.",
                    "is_available": True,
                    "badge": "DATA QUALITY"
                }
            ]
