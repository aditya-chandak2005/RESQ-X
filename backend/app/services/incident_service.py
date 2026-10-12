"""Incident Service: Manages disaster incidents and areas of interest."""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import DisasterEvent, AreaOfInterest, ProcessingJob
import datetime

class IncidentService:
    @staticmethod
    def get_all(db: Session) -> List[DisasterEvent]:
        return db.query(DisasterEvent).all()

    @staticmethod
    def get_by_id(db: Session, disaster_id: int) -> Optional[DisasterEvent]:
        return db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()

    @staticmethod
    def create_incident(db: Session, name: str, disaster_type: str, description: str,
                        center_lat: float, center_lon: float, aoi_geojson: Optional[Dict[str, Any]] = None) -> DisasterEvent:
        incident = DisasterEvent(
            name=name,
            disaster_type=disaster_type,
            description=description,
            center_lat=center_lat,
            center_lon=center_lon,
            aoi_geojson=aoi_geojson,
            status="active",
            incident_date=datetime.datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def get_aois(db: Session, disaster_id: int) -> List[AreaOfInterest]:
        return db.query(AreaOfInterest).filter(AreaOfInterest.disaster_id == disaster_id).all()

    @staticmethod
    def get_processing_jobs(db: Session, disaster_id: int) -> List[ProcessingJob]:
        return db.query(ProcessingJob).filter(ProcessingJob.disaster_id == disaster_id).order_by(ProcessingJob.started_at.desc()).all()
