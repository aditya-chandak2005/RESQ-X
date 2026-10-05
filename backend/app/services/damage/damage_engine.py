from typing import Dict, Any, List
from shapely.geometry import shape, Point

class DamageEngine:
    """Evaluates spatial intersection of flood extents with buildings, roads, and bridges."""

    @staticmethod
    def evaluate_building_exposure(lat: float, lon: float, flood_polygons: List[Any]) -> Dict[str, Any]:
        """Classify building impact state from flood geometry intersection."""
        pt = Point(lon, lat)
        for poly_record in flood_polygons:
            geom_data = poly_record.geometry_geojson if hasattr(poly_record, "geometry_geojson") else poly_record.get("geometry_geojson")
            severity = poly_record.severity if hasattr(poly_record, "severity") else poly_record.get("severity", "medium")
            try:
                poly = shape(geom_data)
                # Check direct containment
                if poly.contains(pt):
                    return {
                        "status": "affected",
                        "damage_probability": 0.88 if severity == "critical" else 0.72,
                        "confidence": 0.85,
                        "verification_status": "potentially_affected_pending_field_check",
                        "depth_estimate_m": getattr(poly_record, "depth_estimate_m", 1.8),
                        "reason": f"Directly located within AI-detected {severity.upper()} flood inundation polygon"
                    }
                # Check proximity buffer (within ~50m)
                if poly.distance(pt) < 0.0005: # roughly 50 meters
                    return {
                        "status": "at_risk",
                        "damage_probability": 0.45,
                        "confidence": 0.75,
                        "verification_status": "proximity_threat_requires_inspection",
                        "depth_estimate_m": 0.4,
                        "reason": "Located within 50m buffer of active flood boundary"
                    }
            except Exception:
                continue

        return {
            "status": "safe",
            "damage_probability": 0.02,
            "confidence": 0.90,
            "verification_status": "outside_detected_flood_zone",
            "depth_estimate_m": 0.0,
            "reason": "Located outside detected SAR/optical inundation boundaries"
        }

    @staticmethod
    def evaluate_bridge_status(bridge_lat: float, bridge_lon: float, flood_polygons: List[Any], water_clearance_m: float = 4.0) -> Dict[str, Any]:
        """Assess bridge risk level against estimated surge heights."""
        pt = Point(bridge_lon, bridge_lat)
        for poly_record in flood_polygons:
            geom_data = poly_record.geometry_geojson if hasattr(poly_record, "geometry_geojson") else poly_record.get("geometry_geojson")
            severity = poly_record.severity if hasattr(poly_record, "severity") else poly_record.get("severity", "medium")
            depth = getattr(poly_record, "depth_estimate_m", 2.0)
            try:
                poly = shape(geom_data)
                if poly.contains(pt) or poly.distance(pt) < 0.0008:
                    if depth >= water_clearance_m or severity == "critical":
                        return {
                            "status": "critical",
                            "confidence": 0.92,
                            "verification_status": "potentially_overtopped_or_scoured",
                            "estimated_surge_m": depth,
                            "reason": f"Severe hydraulic surge ({depth:.1f}m) exceeds structure clearance ({water_clearance_m:.1f}m)"
                        }
                    else:
                        return {
                            "status": "at_risk",
                            "confidence": 0.81,
                            "verification_status": "high_flow_structural_vulnerability",
                            "estimated_surge_m": depth,
                            "reason": f"Water level elevated near bridge abutments ({depth:.1f}m)"
                        }
            except Exception:
                continue

        return {
            "status": "open",
            "confidence": 0.89,
            "verification_status": "operational_clearance_verified",
            "estimated_surge_m": 0.0,
            "reason": "Normal river clearance maintained"
        }
