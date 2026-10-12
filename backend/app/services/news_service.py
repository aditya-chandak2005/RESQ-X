"""News Service: Aggregates and serves disaster-only verified news feeds with provenance tracking."""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import NewsItem
from backend.app.services.providers import OfficialNewsProvider
import datetime

class NewsService:
    def __init__(self, provider=None):
        self.provider = provider or OfficialNewsProvider()

    def get_news(self, db: Session, disaster_id: Optional[int] = None, verification: Optional[str] = None) -> List[NewsItem]:
        query = db.query(NewsItem)
        if disaster_id:
            query = query.filter((NewsItem.disaster_id == disaster_id) | (NewsItem.disaster_id.is_(None)))
        if verification:
            query = query.filter(NewsItem.verification_status == verification)
        return query.order_by(NewsItem.published_at.desc()).all()

    def sync_live_feeds(self, db: Session, disaster_id: int) -> int:
        external_news = self.provider.fetch_disaster_news()
        count = 0
        for item in external_news:
            exists = db.query(NewsItem).filter(NewsItem.headline == item["headline"]).first()
            if not exists:
                new_item = NewsItem(
                    disaster_id=disaster_id,
                    source=item["source"],
                    original_url=item.get("original_url"),
                    headline=item["headline"],
                    summary=item["summary"],
                    hazard_category=item.get("hazard_category", "Flood"),
                    verification_status=item.get("verification_status", "verified_official"),
                    published_at=datetime.datetime.utcnow()
                )
                db.add(new_item)
                count += 1
        if count > 0:
            db.commit()
        return count
