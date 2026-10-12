"""Population Exposure Service: Calculates affected population estimates with uncertainty bounds."""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import PopulationExposure, Settlement

class PopulationExposureService:
    @staticmethod
    def get_exposures(db: Session, disaster_id: int) -> List[Dict[str, Any]]:
        exposures = db.query(PopulationExposure).filter(PopulationExposure.disaster_id == disaster_id).all()
        results = []
        for exp in exposures:
            settlement = db.query(Settlement).filter(Settlement.id == exp.settlement_id).first()
            results.append({
                "settlement_id": exp.settlement_id,
                "settlement_name": settlement.name if settlement else f"Settlement {exp.settlement_id}",
                "exposed_population": exp.exposed_population,
                "uncertainty_min": exp.uncertainty_min,
                "uncertainty_max": exp.uncertainty_max,
                "methodology": exp.methodology,
                "risk_tier": exp.risk_tier,
                "evaluated_at": exp.created_at.isoformat() if exp.created_at else None
            })
        return results

    @staticmethod
    def get_total_exposure(db: Session, disaster_id: int) -> Dict[str, Any]:
        settlements = db.query(Settlement).filter(Settlement.disaster_id == disaster_id).all()
        total_pop = sum(s.estimated_population for s in settlements)
        isolated_pop = sum(s.estimated_population for s in settlements if s.is_isolated)
        return {
            "total_monitored_population": total_pop,
            "isolated_population": isolated_pop,
            "uncertainty_range": [int(isolated_pop * 0.88), int(isolated_pop * 1.15)],
            "methodology": "Census 2021 + OSM Building Density Modeling"
        }
