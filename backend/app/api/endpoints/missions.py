from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.session import get_db
from backend.app.models.models import Mission, RescueTeam, Route, FieldReport
from backend.app.schemas.schemas import (
    MissionCreate,
    MissionResponse,
    MissionStatusUpdate,
    RescueTeamResponse,
    RouteResponse,
    FieldReportCreate,
    FieldReportResponse,
)
from backend.app.services.missions.dynamic_feedback import DynamicResponseLoop

router = APIRouter()

@router.get("", response_model=List[MissionResponse])
def get_missions(disaster_id: int = 1, db: Session = Depends(get_db)):
    """Retrieve all operational rescue missions."""
    missions = db.query(Mission).filter(Mission.disaster_id == disaster_id).all()
    results = []
    for m in missions:
        results.append(MissionResponse(
            id=m.id,
            disaster_id=m.disaster_id,
            settlement_id=m.settlement_id,
            settlement_name=m.settlement.name if m.settlement else None,
            team_id=m.team_id,
            team_name=m.team.name if m.team else None,
            title=m.title,
            status=m.status,
            priority_level=m.priority_level,
            people_targeted=m.people_targeted,
            notes=m.notes,
            created_at=m.created_at,
            routes=[
                RouteResponse(
                    id=r.id,
                    mission_id=r.mission_id,
                    origin_name=r.origin_name,
                    origin_lat=r.origin_lat,
                    origin_lon=r.origin_lon,
                    dest_name=r.dest_name,
                    dest_lat=r.dest_lat,
                    dest_lon=r.dest_lon,
                    distance_km=r.distance_km,
                    eta_minutes=r.eta_minutes,
                    is_alternate=r.is_alternate,
                    is_compromised=r.is_compromised,
                    safety_score=r.safety_score,
                    waypoints_geojson=r.waypoints_geojson,
                    blocked_segments=r.blocked_segments or []
                )
                for r in m.routes
            ]
        ))
    return results

@router.post("", response_model=MissionResponse)
def create_mission(payload: MissionCreate, db: Session = Depends(get_db)):
    """Dispatch or plan a new rescue mission."""
    mission = Mission(
        disaster_id=payload.disaster_id,
        settlement_id=payload.settlement_id,
        team_id=payload.team_id,
        title=payload.title,
        priority_level=payload.priority_level,
        people_targeted=payload.people_targeted,
        notes=payload.notes,
        status="assigned"
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission

@router.patch("/{mission_id}", response_model=Dict[str, Any])
def update_mission_status(mission_id: int, payload: MissionStatusUpdate, db: Session = Depends(get_db)):
    """Update mission progress status from command post or field team."""
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission.status = payload.status
    if payload.notes:
        mission.notes = (mission.notes or "") + "\n" + payload.notes
    db.commit()
    return {"message": "Mission updated", "mission_id": mission_id, "status": mission.status}

@router.get("/teams", response_model=List[RescueTeamResponse])
def get_rescue_teams(disaster_id: int = 1, db: Session = Depends(get_db)):
    """List all deployed and standby rescue teams."""
    return db.query(RescueTeam).filter(RescueTeam.disaster_id == disaster_id).all()

@router.post("/field-reports", response_model=FieldReportResponse)
def submit_field_report(payload: FieldReportCreate, db: Session = Depends(get_db)):
    """Field team feedback loop. Triggers instant topological graph update & dynamic rerouting."""
    result = DynamicResponseLoop.process_field_report(db, payload.model_dump())
    
    report = db.query(FieldReport).filter(FieldReport.id == result["report_id"]).first()
    return FieldReportResponse(
        id=report.id,
        disaster_id=report.disaster_id,
        mission_id=report.mission_id,
        team_id=report.team_id,
        report_type=report.report_type,
        latitude=report.latitude,
        longitude=report.longitude,
        details=report.details,
        severity=report.severity,
        timestamp=report.timestamp,
        applied_to_graph=report.applied_to_graph,
        dynamic_reroute_triggered=result["dynamic_reroute_triggered"],
        rerouted_missions=result["rerouted_missions"]
    )
