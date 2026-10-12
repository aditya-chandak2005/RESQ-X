"""Satellite Service: Discovers, acquires, and calibrates Sentinel-1 SAR and Sentinel-2 optical imagery."""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import SatelliteScene, DisasterEvent
from backend.app.services.providers import CopernicusCDSEProvider
import datetime

class SatelliteService:
    def __init__(self, provider=None):
        self.provider = provider or CopernicusCDSEProvider()

    def discover_scenes(self, db: Session, disaster_id: int) -> List[Dict[str, Any]]:
        disaster = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()
        bbox = [79.4, 30.3, 79.8, 30.7] # Default Chamoli basin bbox
        if disaster and disaster.center_lat and disaster.center_lon:
            bbox = [
                disaster.center_lon - 0.2,
                disaster.center_lat - 0.2,
                disaster.center_lon + 0.2,
                disaster.center_lat + 0.2,
            ]
        
        scenes = self.provider.search_scenes(bbox, "2021-02-05", "2021-02-09")
        
        # Also return any database-registered scenes
        db_scenes = db.query(SatelliteScene).filter(SatelliteScene.disaster_id == disaster_id).all()
        for s in db_scenes:
            scenes.append({
                "scene_id": s.scene_id,
                "platform": s.satellite_name,
                "sensor_mode": s.sensor_type,
                "acquisition_time": s.acquisition_date.isoformat(),
                "cloud_cover_pct": s.cloud_cover_percentage,
                "orbit_direction": "DESCENDING",
                "resolution_m": 10.0,
                "source": "Database Cache",
                "is_cached": True
            })
        return scenes

    def get_calibration_telemetry(self, scene_id: str) -> Dict[str, Any]:
        return self.provider.acquire_scene_telemetry(scene_id)
