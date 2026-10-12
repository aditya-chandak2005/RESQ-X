"""Mission Service: Coordinates rescue team missions, dispatches, and operational status."""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import Mission, RescueTeam, Route
import datetime

class MissionService:
    @staticmethod
    def get_missions(db: Session, disaster_id: int) -> List[Mission]:
        return db.query(Mission).filter(Mission.disaster_id == disaster_id).all()

    @staticmethod
    def get_teams(db: Session, disaster_id: int) -> List[RescueTeam]:
        return db.query(RescueTeam).filter(RescueTeam.disaster_id == disaster_id).all()

    @staticmethod
    def create_mission(db: Session, disaster_id: int, team_id: int, settlement_id: int,
                       title: str, priority_level: str, people_targeted: int, notes: str) -> Mission:
        mission = Mission(
            disaster_id=disaster_id,
            team_id=team_id,
            settlement_id=settlement_id,
            title=title,
            priority_level=priority_level,
            people_targeted=people_targeted,
            status="dispatched",
            notes=notes,
            created_at=datetime.datetime.utcnow()
        )
        db.add(mission)
        db.commit()
        db.refresh(mission)
        return mission
