from typing import Dict, Any, List

class ResourceAllocationEngine:
    """Decision-support resource recommendation engine based on priority, geography, and isolation."""

    @staticmethod
    def calculate_recommendation(
        priority_score: float,
        population: int,
        is_isolated: bool,
        flood_severity: str,
        terrain: str = "alpine_valley"
    ) -> Dict[str, Any]:
        """Generate tailored emergency asset allocation recommendations."""
        recommended_assets = []

        if priority_score >= 80.0:
            recommended_assets.extend([
                {"type": "Rapid Riverine / Alpine SAR Teams", "count": 2 if population > 300 else 1, "priority": "Immediate"},
                {"type": "Advanced Life Support Medical Team", "count": 1, "priority": "Immediate"},
                {"type": "Heavy Inflatable Rescue Boats (Zodiac)", "count": 2 if "high" in flood_severity or "critical" in flood_severity else 1, "priority": "Immediate"},
            ])
            if is_isolated:
                recommended_assets.append({"type": "ALH/Mi-17 Aerial Winch / Heli-drop Unit", "count": 1, "priority": "Critical"})
                recommended_assets.append({"type": "Emergency Water Purification Packs (500L/day)", "count": max(1, population // 200), "priority": "High"})
        elif priority_score >= 60.0:
            recommended_assets.extend([
                {"type": "Standard SAR Rescue Unit", "count": 1, "priority": "Urgent"},
                {"type": "Mobile Trauma Ambulance (4x4)", "count": 1, "priority": "Urgent"},
                {"type": "Emergency Ration Packs", "count": max(10, population // 10), "priority": "High"}
            ])
        elif priority_score >= 40.0:
            recommended_assets.extend([
                {"type": "Local Civil Defense Patrol", "count": 1, "priority": "Routine"},
                {"type": "Basic First Aid Logistics Kit", "count": 2, "priority": "Routine"}
            ])
        else:
            recommended_assets.append({"type": "Periodic Aerial/Drone Monitoring", "count": 1, "priority": "Standby"})

        return {
            "disclaimer": "Decision-support recommendation only. Requires human command confirmation and field triage evaluation.",
            "recommended_allocation": recommended_assets,
            "total_personnel_suggested": sum(a["count"] * 4 for a in recommended_assets if "Team" in a["type"] or "Unit" in a["type"]),
            "triage_urgency": "ALPHA_IMMEDIATE" if priority_score >= 80 else ("BRAVO_URGENT" if priority_score >= 60 else "CHARLIE_ROUTINE")
        }
