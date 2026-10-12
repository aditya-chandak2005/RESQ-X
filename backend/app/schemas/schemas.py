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
    category: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

class CopilotQueryResponse(BaseModel):
    query: str
    response: str
    grounded_data: Dict[str, Any]
    featured_locations: Optional[List[Dict[str, Any]]] = None
    quick_review: Optional[Dict[str, Any]] = None
    suggested_queries: Optional[List[str]] = None
    timestamp: datetime

class QuickReviewResponse(BaseModel):
    review_type: str
    disaster_id: int
    title: str
    status_badge: str
    status_color: str
    generated_at: str
    summary: str
    metrics: Optional[Dict[str, Any]] = None
    key_findings: Optional[List[str]] = None
    critical_red_flags: Optional[List[str]] = None
    recommended_actions: Optional[List[str]] = None
    recommended_command_directives: Optional[List[str]] = None
    settlement_breakdown: Optional[List[Dict[str, Any]]] = None
    teams_status: Optional[List[Dict[str, Any]]] = None
    resources_status: Optional[List[Dict[str, Any]]] = None
    phases: Optional[List[Dict[str, Any]]] = None

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

class LocationAssessmentRequest(BaseModel):
    latitude: float
    longitude: float
    disaster_id: Optional[int] = 1
    location_label: Optional[str] = None

# Official Alerts & News Schemas
class OfficialAlertCreate(BaseModel):
    disaster_id: Optional[int] = 1
    authority: str
    alert_level: str = "RED" # RED, ORANGE, YELLOW
    headline: str
    instruction: str
    source_url: Optional[str] = None
    hours_valid: Optional[int] = 24

class OfficialAlertResponse(BaseModel):
    id: int
    disaster_id: Optional[int]
    authority: str
    alert_level: str
    headline: str
    instruction: str
    effective_until: Optional[datetime]
    source_url: Optional[str]
    verification_status: str
    published_at: datetime

    class Config:
        from_attributes = True

class NewsItemResponse(BaseModel):
    id: int
    disaster_id: Optional[int]
    source: str
    original_url: Optional[str]
    headline: str
    summary: str
    hazard_category: str
    location_tag: str
    verification_status: str
    published_at: datetime

    class Config:
        from_attributes = True

# Knowledge & RAG Schemas
class KnowledgeQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class KnowledgeDocumentResponse(BaseModel):
    id: int
    title: str
    category: str
    source_authority: str
    content_text: str
    metadata_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Situation Report Schemas
class SituationReportResponse(BaseModel):
    id: int
    disaster_id: int
    report_title: str
    incident_version: str
    status: str
    generated_by: str
    report_data_json: Dict[str, Any]
    pdf_filename: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Incident Exploration & Sources Schemas
class IncidentSourceResponse(BaseModel):
    id: int
    provider_name: str
    record_identifier: Optional[str] = None
    source_url: Optional[str] = None
    publication_date: Optional[datetime] = None
    retrieval_timestamp: Optional[datetime] = None
    ingestion_status: str
    coverage_limitations: Optional[str] = None
    raw_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class IncidentDetailResponse(BaseModel):
    id: int
    name: str
    alternative_names: List[str] = []
    disaster_type: str
    status: str
    description: Optional[str] = None
    incident_date: datetime
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    date_precision: str = "day"
    state: str = "Uttarakhand"
    district: Optional[str] = None
    place_name: Optional[str] = None
    country: str = "India"
    center_lat: float
    center_lon: float
    aoi_geojson: Optional[Dict[str, Any]] = None
    severity: Optional[str] = None
    source_org: Optional[str] = None
    source_url: Optional[str] = None
    source_record_id: Optional[str] = None
    source_published_at: Optional[datetime] = None
    verification_status: str = "verified"
    data_availability: Dict[str, Any] = {}
    known_limitations: Optional[str] = None
    sources: List[IncidentSourceResponse] = []
    scenes_count: int = 0
    has_flood_analysis: bool = False
    affected_settlements_count: int = 0

    class Config:
        from_attributes = True


class IncidentSearchResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    items: List[IncidentDetailResponse]
    year_distribution: Dict[int, int] = {}
    hazard_distribution: Dict[str, int] = {}
    applied_filters: Dict[str, Any] = {}


class DataAvailabilityResponse(BaseModel):
    incident_id: int
    incident_name: str
    verification_status: str
    source_status: str
    satellite_imagery: str
    flood_analysis: str
    infrastructure_data: str
    population_exposure: str
    report: str
    data_sources: List[str] = []
    limitations_summary: Optional[str] = None


# Geocoding & Place Resolution Schemas
class GeocodingPlace(BaseModel):
    place_id: str
    name: str
    display_name: str
    feature_type: str
    district: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    latitude: float
    longitude: float
    bbox: Optional[List[float]] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    provider: str
    confidence: float = 1.0
    is_ambiguous: bool = False
    alternate_matches: List[Dict[str, Any]] = []


class GeocodingSearchResponse(BaseModel):
    query: str
    total_matches: int
    places: List[GeocodingPlace]
    provider_attribution: str


class PlaceResolveRequest(BaseModel):
    latitude: float
    longitude: float


class GeometrySearchRequest(BaseModel):
    geometry: Dict[str, Any]
    hazard_type: Optional[str] = None
    status: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None


