from typing import Dict, Any, List

class RescuePriorityEngine:
    """Configurable multi-criteria decision analysis (MCDA) for disaster rescue scoring."""

    def __init__(
        self,
        weight_flood: float = 0.25,
        weight_population: float = 0.25,
        weight_connectivity: float = 0.25,
        weight_hospital: float = 0.15,
        weight_routes: float = 0.10,
    ):
        self.w_flood = weight_flood
        self.w_pop = weight_population
        self.w_conn = weight_connectivity
        self.w_hosp = weight_hospital
        self.w_route = weight_routes

    def calculate_score(
        self,
        settlement_name: str,
        flood_severity: str, # critical, high, medium, low, none
        population: int,
        is_isolated: bool,
        hospital_dist_km: float,
        has_alternate_route: bool,
        critical_bridge_affected: bool = False
    ) -> Dict[str, Any]:
        """Compute 0-100 normalized score and generate human-readable explainability logs."""
        explanations: List[str] = []

        # 1. Flood Severity Factor (0 - 100)
        sev_map = {
            "critical": 100.0,
            "high": 80.0,
            "medium": 50.0,
            "low": 25.0,
            "none": 5.0
        }
        raw_flood = sev_map.get(flood_severity.lower(), 25.0)
        flood_factor = raw_flood * self.w_flood
        if raw_flood >= 80:
            explanations.append(f"High flood severity ({flood_severity.upper()}) detected from satellite SAR/optical overlay")

        # 2. Population Exposure Factor (0 - 100)
        # Scaled log-linear for population sizes: 100 -> 30, 500 -> 70, 1000+ -> 90+
        if population > 5000:
            raw_pop = 100.0
        elif population > 1000:
            raw_pop = 85.0
        elif population > 300:
            raw_pop = 70.0
        elif population > 50:
            raw_pop = 45.0
        else:
            raw_pop = 20.0
        pop_factor = raw_pop * self.w_pop
        if population > 300:
            explanations.append(f"Significant exposed civilian population (~{population:,} people)")

        # 3. Connectivity Loss Factor (0 - 100)
        if is_isolated:
            raw_conn = 100.0
            explanations.append("Complete road & infrastructure severance (Settlement ISOLATED)")
        else:
            raw_conn = 20.0
        conn_factor = raw_conn * self.w_conn

        # 4. Hospital Accessibility Factor (0 - 100)
        if hospital_dist_km > 25.0 or is_isolated:
            raw_hosp = 100.0
            explanations.append(f"Critically impaired trauma care access (Nearest facility > {hospital_dist_km:.1f} km)")
        elif hospital_dist_km > 10.0:
            raw_hosp = 65.0
            explanations.append(f"Extended evacuation transit required ({hospital_dist_km:.1f} km)")
        else:
            raw_hosp = 20.0
        hosp_factor = raw_hosp * self.w_hosp

        # 5. Route Availability & Bridge Factor (0 - 100)
        if critical_bridge_affected and not has_alternate_route:
            raw_route = 100.0
            explanations.append("Key bridge failure with ZERO alternate ground access corridors")
        elif not has_alternate_route:
            raw_route = 75.0
            explanations.append("Single point of failure: No viable secondary detour route")
        else:
            raw_route = 20.0
        route_factor = raw_route * self.w_route

        # Total Composite Score
        total_score = round(flood_factor + pop_factor + conn_factor + hosp_factor + route_factor, 1)
        total_score = min(100.0, max(0.0, total_score))

        # Assign Classification Level
        if total_score >= 80.0:
            level = "CRITICAL"
        elif total_score >= 60.0:
            level = "HIGH"
        elif total_score >= 40.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "settlement_name": settlement_name,
            "priority_score": total_score,
            "priority_level": level,
            "breakdown": {
                "flood_severity_factor": round(flood_factor, 1),
                "population_factor": round(pop_factor, 1),
                "connectivity_loss_factor": round(conn_factor, 1),
                "hospital_accessibility_factor": round(hosp_factor, 1),
                "route_availability_factor": round(route_factor, 1),
            },
            "explanations": explanations
        }
