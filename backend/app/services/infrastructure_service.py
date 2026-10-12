"""Infrastructure Service: Monitors buildings, bridges, and road network exposure against flood vectors."""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import InfrastructureAsset, Bridge, RoadSegment

class InfrastructureService:
    @staticmethod
    def get_infrastructure_overview(db: Session, disaster_id: int) -> Dict[str, Any]:
        assets = db.query(InfrastructureAsset).filter(InfrastructureAsset.disaster_id == disaster_id).all()
        bridges = db.query(Bridge).filter(Bridge.disaster_id == disaster_id).all()
        roads = db.query(RoadSegment).filter(RoadSegment.disaster_id == disaster_id).all()

        return {
            "total_buildings": len(assets),
            "affected_buildings": sum(1 for a in assets if a.status in ("affected", "destroyed")),
            "critical_bridges": [b.name for b in bridges if b.status in ("critical", "destroyed")],
            "blocked_roads": [r.name for r in roads if r.is_blocked],
            "bridges": bridges,
            "roads": roads,
            "assets": assets
        }
