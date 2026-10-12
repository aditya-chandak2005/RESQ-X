"""Resource Service: Manages emergency equipment, personnel inventories, and staging allocations."""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Resource, Settlement

class ResourceService:
    @staticmethod
    def get_inventory(db: Session, disaster_id: int) -> List[Resource]:
        return db.query(Resource).filter(Resource.disaster_id == disaster_id).all()

    @staticmethod
    def get_allocation_recommendations(db: Session, disaster_id: int) -> List[Dict[str, Any]]:
        settlements = db.query(Settlement).filter(Settlement.disaster_id == disaster_id).all()
        isolated = [s for s in settlements if s.is_isolated]

        recommendations = []
        for s in isolated:
            if s.estimated_population > 1000:
                recommendations.append({
                    "settlement_name": s.name,
                    "target_population": s.estimated_population,
                    "recommended_assets": [
                        {"asset": "Heavy Utility Helicopter (MI-17V5)", "quantity": 2, "purpose": "Emergency supply airlift & winch extraction"},
                        {"asset": "NDRF Flood Inundation Column", "quantity": 2, "purpose": "Ground medical triage & trench cutting"},
                        {"asset": "Emergency Ration Packs", "quantity": 1500, "purpose": "72-hour life sustainment"}
                    ]
                })
            else:
                recommendations.append({
                    "settlement_name": s.name,
                    "target_population": s.estimated_population,
                    "recommended_assets": [
                        {"asset": "Light Utility Helicopter (ALH Dhruv)", "quantity": 1, "purpose": "Aerial visual reconnaissance & medical drops"},
                        {"asset": "SDRF Mountain Rescue Team", "quantity": 1, "purpose": "Ridge foot bypass traversal"},
                        {"asset": "Emergency Water Purification Units", "quantity": 500, "purpose": "Potable water supply"}
                    ]
                })
        return recommendations
