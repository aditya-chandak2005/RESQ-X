from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Disaster Schemas
class DisasterCreate(BaseModel):
    name: str
    disaster_type: str = "flash_flood"
    description: Optional[str] = None
    center_lat: float = 30.4850
    center_lon: float = 79.6200
    aoi_geojson: Optional[Dict[str, Any]] = None

class DisasterResponse(BaseModel):
    id: int
    name: str
    disaster_type: str
    status: str
    description: Optional[str]
    incident_date: datetime
    center_lat: float
    center_lon: float
    aoi_geojson: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

# Analysis Request
class DisasterAnalyzeRequest(BaseModel):
    pre_event_date: Optional[str] = "2026-02-03"
    post_event_date: Optional[str] = "2026-02-07"
    response_base_name: Optional[str] = "Joshimath Command Post"
    base_lat: Optional[float] = 30.5580
    base_lon: Optional[float] = 79.5645
    upstream_lat: Optional[float] = 30.5600
    upstream_lon: Optional[float] = 79.7400
    confidence_threshold: Optional[float] = 0.65

# Flood Schemas
class FloodPolygonResponse(BaseModel):
    id: int
    severity: str
    depth_estimate_m: float
    confidence: float
    area_sqm: float
    geometry_geojson: Dict[str, Any]

class FloodResultResponse(BaseModel):
    id: int
    analysis_timestamp: datetime
    model_name: str
    model_version: str
    confidence_score: float
    total_flooded_area_sqkm: float
    severity_breakdown: Dict[str, float]
    validation_iou: float
    validation_f1: float
    polygons: List[FloodPolygonResponse] = []

# Settlement & Damage Schemas
class SettlementResponse(BaseModel):
    id: int
    name: str
    settlement_type: str
    estimated_population: int
    population_source: str
    latitude: float
    longitude: float
    elevation_m: float
    is_isolated: bool
    isolation_reason: Optional[str]
    nearest_hospital_name: Optional[str]
    nearest_hospital_dist_km: float
    nearest_town_dist_km: float
    connectivity_status: str
    flood_severity_exposure: str
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None
    explanations: Optional[List[str]] = []

class InfrastructureAssetResponse(BaseModel):
    id: int
    osm_id: Optional[str]
    asset_type: str
    name: Optional[str]
    latitude: float
    longitude: float
    status: str
    damage_probability: float
    confidence: float
    verification_status: str
    source: str

class BridgeResponse(BaseModel):
    id: int
    osm_id: Optional[str]
    name: str
    road_name: str
    latitude: float
    longitude: float
    status: str
    water_clearance_m: float
    confidence: float
    verification_status: str

class RoadSegmentResponse(BaseModel):
    id: int
    osm_id: Optional[str]
    name: str
    highway_type: str
    length_m: float
    status: str
    is_blocked: bool
    blockage_reason: Optional[str]
    geometry_geojson: Dict[str, Any]

# Rescue Priority Schemas
class RescuePriorityResponse(BaseModel):
    id: int
    settlement_id: int
    settlement_name: str
    priority_score: float
    priority_level: str
    flood_severity_factor: float
    population_factor: float
    connectivity_loss_factor: float
    hospital_accessibility_factor: float
    route_availability_factor: float
    explanations: List[str]

# Resource & Team Schemas
class ResourceResponse(BaseModel):
    id: int
    resource_type: str
    total_available: int
    allocated: int
    base_location_name: str

class RescueTeamResponse(BaseModel):
    id: int
    name: str
    team_type: str
    status: str
    personnel_count: int
    equipment_summary: str
    current_lat: float
    current_lon: float

# Mission & Route Schemas
class MissionCreate(BaseModel):
    disaster_id: int
    settlement_id: int
    team_id: Optional[int] = None
    title: str
    priority_level: str = "HIGH"
    people_targeted: int = 100
    notes: Optional[str] = None

class MissionStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class RouteResponse(BaseModel):
    id: int
    mission_id: Optional[int]
    origin_name: str
    origin_lat: float
    origin_lon: float
    dest_name: str
    dest_lat: float
    dest_lon: float
    distance_km: float
    eta_minutes: float
    is_alternate: bool
    is_compromised: bool
    safety_score: float
    waypoints_geojson: Dict[str, Any]
    blocked_segments: List[Dict[str, Any]] = []

class MissionResponse(BaseModel):
    id: int
    disaster_id: int
    settlement_id: int
    settlement_name: Optional[str]
    team_id: Optional[int]
    team_name: Optional[str]
    title: str
    status: str
    priority_level: str
    people_targeted: int
    notes: Optional[str]
    created_at: datetime
    routes: List[RouteResponse] = []

# Field Report Schemas (Dynamic Closed Loop)
class FieldReportCreate(BaseModel):
    disaster_id: int
    mission_id: Optional[int] = None
    team_id: Optional[int] = None
    report_type: str # bridge_destroyed, road_blocked, people_located, medical_emergency, evacuation_required, road_reopened
    latitude: float
    longitude: float
    details: str
    severity: str = "high"

class FieldReportResponse(BaseModel):
    id: int
    disaster_id: int
    mission_id: Optional[int]
    team_id: Optional[int]
    report_type: str
    latitude: float
    longitude: float
    details: str
    severity: str
    timestamp: datetime
    applied_to_graph: bool
    dynamic_reroute_triggered: bool = False
    rerouted_missions: List[int] = []

# Simulation Schemas
class SimulationRequest(BaseModel):
    disaster_id: int
    scenario_type: str # bridge_failure, flood_expansion, road_closure
    target_bridge_id: Optional[int] = None
    expansion_percentage: Optional[float] = 20.0
    target_road_id: Optional[int] = None

# Copilot Schemas
class CopilotQueryRequest(BaseModel):
    disaster_id: Optional[int] = 1
    query: str

class CopilotQueryResponse(BaseModel):
    query: str
    response: str
    grounded_data: Dict[str, Any]
    timestamp: datetime

# Summary / KPI Schema
class DashboardKpis(BaseModel):
    flooded_area_sqkm: float
    affected_buildings: int
    blocked_roads: int
    critical_bridges: int
    exposed_population: int
    isolated_settlements: int
    critical_priority_zones: int
    active_rescue_missions: int
