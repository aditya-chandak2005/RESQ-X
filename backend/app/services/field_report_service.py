"""Field Report Service: Processes ground reconnaissance feedback and triggers dynamic rerouting."""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import FieldReport
from backend.app.services.missions.dynamic_feedback import DynamicResponseLoop

class FieldReportService:
    @staticmethod
    def get_reports(db: Session, disaster_id: int) -> List[FieldReport]:
        return db.query(FieldReport).filter(FieldReport.disaster_id == disaster_id).order_by(FieldReport.timestamp.desc()).all()

    @staticmethod
    def submit_report(db: Session, report_data: Dict[str, Any]) -> Dict[str, Any]:
        return DynamicResponseLoop.process_field_report(db, report_data)
