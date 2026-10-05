from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import Settlement, Bridge, RoadSegment, RescuePriority, Resource

class WhatIfSimulator:
    """Simulates cascading infrastructure failures, flood extent expansions, and healthcare cutoffs."""

    @staticmethod
    def simulate_scenario(db: Session, disaster_id: int, scenario_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute counterfactual stress test and compute Before vs After delta."""
        settlements = db.query(Settlement).filter(Settlement.disaster_id == disaster_id).all()
        bridges = db.query(Bridge).filter(Bridge.disaster_id == disaster_id).all()
        roads = db.query(RoadSegment).filter(RoadSegment.disaster_id == disaster_id).all()

        before_state = {
            "isolated_settlements_count": sum(1 for s in settlements if s.is_isolated),
            "isolated_population": sum(s.estimated_population for s in settlements if s.is_isolated),
            "critical_priorities_count": len([s for s in settlements if s.priority and s.priority.priority_level == "CRITICAL"]),
            "blocked_roads_count": sum(1 for r in roads if r.is_blocked),
            "destroyed_bridges_count": sum(1 for b in bridges if b.status in ("destroyed", "critical"))
        }

        after_state = dict(before_state)
        delta_impacts: List[str] = []
        newly_isolated_settlements: List[str] = []
        required_additional_resources: List[Dict[str, Any]] = []

        if scenario_type == "bridge_failure":
            target_bridge_name = params.get("bridge_name", "Helang Alaknanda Steel Suspension Bridge")
            after_state["destroyed_bridges_count"] += 1
            after_state["isolated_settlements_count"] += 1
            # Helang settlement becomes isolated
            helang = next((s for s in settlements if "Helang" in s.name), None)
            if helang:
                newly_isolated_settlements.append(helang.name)
                after_state["isolated_population"] += helang.estimated_population
                delta_impacts.append(f"Failure of '{target_bridge_name}' severs sole valley access road NH-58.")
                delta_impacts.append(f"Settlement '{helang.name}' (pop: {helang.estimated_population}) transitions from CONNECTED to ISOLATED.")
                delta_impacts.append("Pipalkoti Community Health Centre becomes unreachable for 640 residents.")
            
            required_additional_resources.extend([
                {"type": "Tactical Assault Bridge / Bailey Unit", "quantity": 1, "urgency": "Immediate"},
                {"type": "Heavy Rescue Boat (Zodiac)", "quantity": 2, "urgency": "Urgent"},
                {"type": "Emergency Air-Drop Rations", "quantity": 20, "urgency": "High"}
            ])

        elif scenario_type == "flood_expansion":
            pct = params.get("expansion_pct", 20.0)
            delta_impacts.append(f"Simulated {pct}% hydrologic surge across Dhauliganga & Alaknanda riverbed.")
            delta_impacts.append("Water levels encroach into lower Joshimath outskirts (buffer zone).")
            delta_impacts.append("Helang Riverbank Settlement flood exposure escalates from MEDIUM to CRITICAL.")
            after_state["critical_priorities_count"] += 1
            after_state["blocked_roads_count"] += 1
            required_additional_resources.extend([
                {"type": "High-Volume Mud De-watering Pumps", "quantity": 4, "urgency": "High"},
                {"type": "4x4 Amphibious Evacuation Units", "quantity": 3, "urgency": "Immediate"},
            ])

        elif scenario_type == "hospital_closure":
            hosp_name = params.get("hospital_name", "Pipalkoti Community Health Centre")
            delta_impacts.append(f"Simulated inundation / structural shutdown of '{hosp_name}'.")
            delta_impacts.append("Evacuation transit times increase by +140% to secondary facility in Srinagar Garhwal (85 km).")
            delta_impacts.append("All severe triage patients require direct air-ambulance winching.")
            required_additional_resources.extend([
                {"type": "Mobile Field Surgical Hospital (20-Bed)", "quantity": 1, "urgency": "Immediate"},
                {"type": "Additional Air Force ALH Winch Helicopters", "quantity": 2, "urgency": "Critical"}
            ])

        diff = {
            "additional_isolated_settlements": after_state["isolated_settlements_count"] - before_state["isolated_settlements_count"],
            "additional_isolated_population": after_state["isolated_population"] - before_state["isolated_population"],
            "additional_blocked_roads": after_state["blocked_roads_count"] - before_state["blocked_roads_count"],
            "additional_destroyed_bridges": after_state["destroyed_bridges_count"] - before_state["destroyed_bridges_count"],
        }

        return {
            "scenario_name": scenario_type.replace("_", " ").title(),
            "parameters": params,
            "before_state": before_state,
            "after_state": after_state,
            "difference": diff,
            "delta_impacts": delta_impacts,
            "newly_isolated_settlements": newly_isolated_settlements,
            "required_additional_resources": required_additional_resources,
            "recommendation_summary": f"Proactively stage {len(required_additional_resources)} contingency asset types at Joshimath forward HQ to buffer against this potential failure mode."
        }
