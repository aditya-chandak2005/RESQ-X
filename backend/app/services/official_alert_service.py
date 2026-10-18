"""Official Alert Service: Dispatches and queries authoritative emergency alerts (NDMA, IMD, CWC)."""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import OfficialAlert
from backend.app.services.providers import NDMAAlertsProvider
import datetime

class OfficialAlertService:
    def __init__(self, provider=None):
        self.provider = provider or NDMAAlertsProvider()

    def get_alerts(self, db: Session, disaster_id: Optional[int] = None, alert_level: Optional[str] = None) -> List[OfficialAlert]:
        query = db.query(OfficialAlert)
        if disaster_id:
            query = query.filter((OfficialAlert.disaster_id == disaster_id) | (OfficialAlert.disaster_id.is_(None)))
        if alert_level:
            query = query.filter(OfficialAlert.alert_level == alert_level.upper())
        return query.order_by(OfficialAlert.published_at.desc()).all()

    def create_alert(self, db: Session, disaster_id: int, authority: str, alert_level: str,
                     headline: str, instruction: str, source_url: str = None, hours_valid: int = 24) -> OfficialAlert:
        alert = OfficialAlert(
            disaster_id=disaster_id,
            authority=authority,
            alert_level=alert_level.upper(),
            headline=headline,
            instruction=instruction,
            effective_until=datetime.datetime.utcnow() + datetime.timedelta(hours=hours_valid),
            source_url=source_url,
            verification_status="official_verified",
            published_at=datetime.datetime.utcnow()
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    def sync_live_alerts(self, db: Session, disaster_id: int) -> int:
        from backend.app.services.ingestion.pipeline_engine import PipelineEngine
        engine = PipelineEngine()
        result = engine.run_ingestion_cycle(db)
        return result.get("total_new_stored", 0)
