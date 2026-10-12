"""Priority Service: Evaluates Multi-Criteria Decision Analysis (MCDA) rescue priority rankings."""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import RescuePriority, Settlement, Bridge, RoadSegment
from backend.app.services.risk.priority_engine import RescuePriorityEngine

class PriorityService:
    @staticmethod
    def get_priorities(db: Session, disaster_id: int) -> List[RescuePriority]:
        return db.query(RescuePriority).filter(RescuePriority.disaster_id == disaster_id).order_by(RescuePriority.priority_score.desc()).all()

    @staticmethod
    def recompute_priorities(db: Session, disaster_id: int) -> List[Dict[str, Any]]:
        engine = RescuePriorityEngine()
        settlements = db.query(Settlement).filter(Settlement.disaster_id == disaster_id).all()
        bridges = db.query(Bridge).filter(Bridge.disaster_id == disaster_id).all()
        destroyed_bridges = [b for b in bridges if b.status in ("destroyed", "critical")]

        results = []
        for s in settlements:
            bridge_affected = any("Raini" in b.name for b in destroyed_bridges) if "Raini" in s.name else False
            score_data = engine.calculate_score(
                settlement_name=s.name,
                flood_severity=s.flood_severity_exposure,
                population=s.estimated_population,
                is_isolated=s.is_isolated,
                hospital_dist_km=s.nearest_hospital_dist_km,
                has_alternate_route=not s.is_isolated,
                critical_bridge_affected=bridge_affected
            )

            prio = db.query(RescuePriority).filter(
                RescuePriority.disaster_id == disaster_id,
                RescuePriority.settlement_id == s.id
            ).first()

            if prio:
                prio.priority_score = score_data["score"]
                prio.priority_level = score_data["level"]
                prio.flood_severity_factor = score_data["factors"]["flood_severity"]
                prio.population_factor = score_data["factors"]["population"]
                prio.connectivity_loss_factor = score_data["factors"]["connectivity_loss"]
                prio.hospital_accessibility_factor = score_data["factors"]["hospital_access"]
                prio.route_availability_factor = score_data["factors"]["route_availability"]
                prio.explanations = score_data["explanations"]

            results.append({
                "settlement_name": s.name,
                "score": score_data["score"],
                "level": score_data["level"],
                "explanations": score_data["explanations"]
            })

        db.commit()
        return results
