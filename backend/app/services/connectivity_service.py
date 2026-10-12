"""Connectivity Service: Analyzes road graphs, bridge washouts, and cut-off settlements."""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import Settlement, Bridge, RoadSegment, InfrastructureAsset, ConnectivityResult
from backend.app.services.connectivity.graph import DisasterRoadGraph

class ConnectivityService:
    @staticmethod
    def evaluate_settlement_connectivity(db: Session, disaster_id: int) -> List[Dict[str, Any]]:
        settlements = db.query(Settlement).filter(Settlement.disaster_id == disaster_id).all()
        bridges = db.query(Bridge).filter(Bridge.disaster_id == disaster_id).all()
        roads = db.query(RoadSegment).filter(RoadSegment.disaster_id == disaster_id).all()
        hospitals = db.query(InfrastructureAsset).filter(
            InfrastructureAsset.disaster_id == disaster_id,
            InfrastructureAsset.asset_type.in_(["hospital", "health_center"])
        ).all()

        graph_engine = DisasterRoadGraph()
        graph_engine.build_network(settlements, hospitals, roads, bridges)

        results = []
        for s in settlements:
            res = graph_engine.analyze_isolation(s.id)
            results.append({
                "settlement_id": s.id,
                "settlement_name": s.name,
                "is_isolated": s.is_isolated or not res.get("can_reach_base", True),
                "hospital_reachable": res.get("can_reach_hospital", not s.is_isolated),
                "nearest_hospital_dist_km": s.nearest_hospital_dist_km,
                "isolation_reason": s.isolation_reason,
                "transit_time_min": s.nearest_hospital_dist_km * 4.5 if s.is_isolated else s.nearest_hospital_dist_km * 2.2
            })
        return results

    @staticmethod
    def get_connectivity_records(db: Session, disaster_id: int) -> List[ConnectivityResult]:
        return db.query(ConnectivityResult).filter(ConnectivityResult.disaster_id == disaster_id).all()
