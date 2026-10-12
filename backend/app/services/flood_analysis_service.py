"""Flood Analysis Service: AI flood extent detection, polygon generation, and severity classification."""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import FloodResult, FloodPolygon, DisasterEvent

class FloodAnalysisService:
    @staticmethod
    def get_flood_result(db: Session, disaster_id: int) -> Optional[FloodResult]:
        return db.query(FloodResult).filter(FloodResult.disaster_id == disaster_id).first()

    @staticmethod
    def calculate_severity_summary(db: Session, disaster_id: int) -> Dict[str, Any]:
        polygons = db.query(FloodPolygon).filter(FloodPolygon.disaster_id == disaster_id).all()
        breakdown = {
            "critical_sqkm": sum(p.area_sqm / 1e6 for p in polygons if p.severity == "critical"),
            "high_sqkm": sum(p.area_sqm / 1e6 for p in polygons if p.severity == "high"),
            "medium_sqkm": sum(p.area_sqm / 1e6 for p in polygons if p.severity == "medium"),
            "low_sqkm": sum(p.area_sqm / 1e6 for p in polygons if p.severity == "low"),
            "total_polygons": len(polygons)
        }
        return breakdown
