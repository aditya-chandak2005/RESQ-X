import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    disaster_type = Column(String(100), default="flash_flood")
    status = Column(String(50), default="active", index=True) # active, monitoring, resolved
    description = Column(Text, nullable=True)
    incident_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Bounding Box / AOI in GeoJSON format
    center_lat = Column(Float, default=30.40)
    center_lon = Column(Float, default=79.35)
    aoi_geojson = Column(JSON, nullable=True)
    
    # Relationships
    scenes = relationship("SatelliteScene", back_populates="disaster", cascade="all, delete-orphan")
    flood_results = relationship("FloodResult", back_populates="disaster", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="disaster", cascade="all, delete-orphan")
    infrastructure = relationship("InfrastructureAsset", back_populates="disaster", cascade="all, delete-orphan")
    bridges = relationship("Bridge", back_populates="disaster", cascade="all, delete-orphan")
    roads = relationship("RoadSegment", back_populates="disaster", cascade="all, delete-orphan")
    priorities = relationship("RescuePriority", back_populates="disaster", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="disaster", cascade="all, delete-orphan")
    teams = relationship("RescueTeam", back_populates="disaster", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="disaster", cascade="all, delete-orphan")
    field_reports = relationship("FieldReport", back_populates="disaster", cascade="all, delete-orphan")
    simulations = relationship("ScenarioSimulation", back_populates="disaster", cascade="all, delete-orphan")


class SatelliteScene(Base):
    __tablename__ = "satellite_scenes"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    satellite_name = Column(String(100), default="Sentinel-1 SAR") # Sentinel-1 SAR, Sentinel-2 Optical
    sensor_type = Column(String(50), default="C-SAR")
    acquisition_date = Column(DateTime, nullable=False)
    is_pre_event = Column(Boolean, default=False) # True = Pre-disaster reference, False = Post-event
    cloud_coverage_pct = Column(Float, default=0.0)
    resolution_m = Column(Float, default=10.0)
    scene_identifier = Column(String(255), nullable=True)
    raw_bands = Column(JSON, nullable=True) # e.g. {"vv": path, "vh": path} or {"b4": red, "b8": nir}

    disaster = relationship("DisasterEvent", back_populates="scenes")


class FloodResult(Base):
    __tablename__ = "flood_results"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    analysis_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    model_name = Column(String(100), default="RESQ-Net-SARv2")
    model_version = Column(String(50), default="2.1.0-kuro-siwo")
    confidence_score = Column(Float, default=0.88)
    total_flooded_area_sqkm = Column(Float, default=0.0)
    severity_breakdown = Column(JSON, default=dict) # {"critical": 12.4, "high": 25.1, "medium": 45.2, "low": 18.0}
    validation_iou = Column(Float, default=0.842) # Validated against benchmark / EMS
    validation_f1 = Column(Float, default=0.891)
    
    disaster = relationship("DisasterEvent", back_populates="flood_results")
    polygons = relationship("FloodPolygon", back_populates="flood_result", cascade="all, delete-orphan")


class FloodPolygon(Base):
    __tablename__ = "flood_polygons"

    id = Column(Integer, primary_key=True, index=True)
    flood_result_id = Column(Integer, ForeignKey("flood_results.id"), index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    severity = Column(String(50), default="high") # critical, high, medium, low
    depth_estimate_m = Column(Float, default=1.5)
    confidence = Column(Float, default=0.85)
    area_sqm = Column(Float, default=0.0)
    geometry_geojson = Column(JSON, nullable=False) # Polygon / MultiPolygon Coordinates

    flood_result = relationship("FloodResult", back_populates="polygons")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    name = Column(String(200), nullable=False)
    settlement_type = Column(String(50), default="village") # town, village, hamlet
    estimated_population = Column(Integer, default=0)
    population_source = Column(String(100), default="Building-count & LandScan estimate")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, default=1250.0)
    is_isolated = Column(Boolean, default=False, index=True)
    isolation_reason = Column(String(255), nullable=True)
    nearest_hospital_name = Column(String(200), nullable=True)
    nearest_hospital_dist_km = Column(Float, default=0.0)
    nearest_town_dist_km = Column(Float, default=0.0)
    connectivity_status = Column(String(50), default="normal") # normal, impaired, severed
    flood_severity_exposure = Column(String(50), default="none") # none, low, medium, high, critical

    disaster = relationship("DisasterEvent", back_populates="settlements")
    priority = relationship("RescuePriority", back_populates="settlement", uselist=False)
    missions = relationship("Mission", back_populates="settlement")


class InfrastructureAsset(Base):
    __tablename__ = "infrastructure_assets"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    osm_id = Column(String(100), nullable=True)
    asset_type = Column(String(50), index=True) # building, hospital, shelter, power, communication
    name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geometry_geojson = Column(JSON, nullable=True)
    status = Column(String(50), default="safe", index=True) # safe, at_risk, affected, destroyed
    damage_probability = Column(Float, default=0.0)
    confidence = Column(Float, default=0.80)
    verification_status = Column(String(50), default="unverified") # unverified, field_confirmed
    source = Column(String(100), default="OpenStreetMap + SAR overlay")

    disaster = relationship("DisasterEvent", back_populates="infrastructure")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    osm_id = Column(String(100), nullable=True)
    name = Column(String(255), default="Access Road")
    highway_type = Column(String(50), default="primary")
    length_m = Column(Float, default=0.0)
    status = Column(String(50), default="open", index=True) # open, at_risk, blocked, washed_out
    is_blocked = Column(Boolean, default=False, index=True)
    blockage_reason = Column(String(255), nullable=True)
    geometry_geojson = Column(JSON, nullable=False) # LineString
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)

    disaster = relationship("DisasterEvent", back_populates="roads")


class Bridge(Base):
    __tablename__ = "bridges"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    osm_id = Column(String(100), nullable=True)
    name = Column(String(255), nullable=False)
    road_name = Column(String(255), default="Connecting Route")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(50), default="open", index=True) # open, at_risk, critical, destroyed
    water_clearance_m = Column(Float, default=4.0)
    confidence = Column(Float, default=0.82)
    verification_status = Column(String(50), default="pending_field_check")

    disaster = relationship("DisasterEvent", back_populates="bridges")


class RescuePriority(Base):
    __tablename__ = "rescue_priorities"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    settlement_id = Column(Integer, ForeignKey("settlements.id"), index=True)
    priority_score = Column(Float, default=50.0, index=True) # 0 to 100
    priority_level = Column(String(50), default="MEDIUM", index=True) # CRITICAL, HIGH, MEDIUM, LOW
    flood_severity_factor = Column(Float, default=0.0)
    population_factor = Column(Float, default=0.0)
    connectivity_loss_factor = Column(Float, default=0.0)
    hospital_accessibility_factor = Column(Float, default=0.0)
    route_availability_factor = Column(Float, default=0.0)
    explanations = Column(JSON, default=list) # List of natural-language reasons

    disaster = relationship("DisasterEvent", back_populates="priorities")
    settlement = relationship("Settlement", back_populates="priority")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    resource_type = Column(String(100), nullable=False) # rescue_boats, ambulances, 4x4_vehicles, helicopters, medical_kits, water_purifiers, emergency_rations
    total_available = Column(Integer, default=10)
    allocated = Column(Integer, default=0)
    base_location_name = Column(String(200), default="Rishikesh Forward HQ")
    latitude = Column(Float, default=30.0869)
    longitude = Column(Float, default=78.2676)

    disaster = relationship("DisasterEvent", back_populates="resources")


class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    name = Column(String(100), nullable=False) # Alpha-1 NDRF, Bravo-4 Medical, Charlie SAR
    team_type = Column(String(100), default="Water Rescue SAR")
    status = Column(String(50), default="idle", index=True) # idle, deployed, en_route, on_scene, returning
    personnel_count = Column(Integer, default=6)
    equipment_summary = Column(String(255), default="Inflatable rafts, First aid, Satellite radio")
    current_lat = Column(Float, default=30.0869)
    current_lon = Column(Float, default=78.2676)

    disaster = relationship("DisasterEvent", back_populates="teams")
    missions = relationship("Mission", back_populates="team")


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    settlement_id = Column(Integer, ForeignKey("settlements.id"), index=True)
    team_id = Column(Integer, ForeignKey("rescue_teams.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", index=True) # pending, assigned, en_route, on_scene, rerouted, completed
    priority_level = Column(String(50), default="HIGH")
    people_targeted = Column(Integer, default=100)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    disaster = relationship("DisasterEvent", back_populates="missions")
    settlement = relationship("Settlement", back_populates="missions")
    team = relationship("RescueTeam", back_populates="missions")
    routes = relationship("Route", back_populates="mission", cascade="all, delete-orphan")
    field_reports = relationship("FieldReport", back_populates="mission")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=True, index=True)
    origin_name = Column(String(200), default="Command Base")
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    dest_name = Column(String(200), nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lon = Column(Float, nullable=False)
    distance_km = Column(Float, default=0.0)
    eta_minutes = Column(Float, default=0.0)
    is_alternate = Column(Boolean, default=False)
    is_compromised = Column(Boolean, default=False)
    safety_score = Column(Float, default=95.0) # 0 to 100
    waypoints_geojson = Column(JSON, nullable=False) # LineString
    blocked_segments = Column(JSON, default=list)

    mission = relationship("Mission", back_populates="routes")


class FieldReport(Base):
    __tablename__ = "field_reports"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("rescue_teams.id"), nullable=True)
    report_type = Column(String(100), nullable=False) # bridge_destroyed, road_blocked, people_located, medical_emergency, evacuation_required, road_reopened
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    details = Column(Text, nullable=False)
    severity = Column(String(50), default="high")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    applied_to_graph = Column(Boolean, default=False)

    disaster = relationship("DisasterEvent", back_populates="field_reports")
    mission = relationship("Mission", back_populates="field_reports")


class ScenarioSimulation(Base):
    __tablename__ = "scenario_simulations"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    name = Column(String(255), nullable=False)
    scenario_type = Column(String(100), nullable=False) # bridge_failure, flood_expansion, hospital_closure
    parameters_json = Column(JSON, default=dict)
    results_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    disaster = relationship("DisasterEvent", back_populates="simulations")


class CopilotQuery(Base):
    __tablename__ = "copilot_queries"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), nullable=True)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    retrieved_data_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    actor = Column(String(100), default="Command Operator")
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class AreaOfInterest(Base):
    __tablename__ = "areas_of_interest"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    name = Column(String(200), nullable=False)
    bbox_coordinates = Column(JSON, nullable=True)
    geometry_geojson = Column(JSON, nullable=True)
    area_sqkm = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    job_type = Column(String(100), nullable=False) # satellite_acquisition, sar_segmentation, osm_intersection, graph_connectivity
    status = Column(String(50), default="pending", index=True) # pending, running, completed, failed
    progress_pct = Column(Integer, default=0)
    stage_name = Column(String(200), nullable=True)
    stage_details = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class PopulationExposure(Base):
    __tablename__ = "population_exposures"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    settlement_id = Column(Integer, ForeignKey("settlements.id"), index=True)
    exposed_population = Column(Integer, default=0)
    uncertainty_min = Column(Integer, default=0)
    uncertainty_max = Column(Integer, default=0)
    methodology = Column(String(100), default="LandScan + Building Footprints")
    risk_tier = Column(String(50), default="HIGH")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ConnectivityResult(Base):
    __tablename__ = "connectivity_results"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    settlement_id = Column(Integer, ForeignKey("settlements.id"), index=True)
    is_isolated = Column(Boolean, default=False)
    isolation_reason = Column(String(255), nullable=True)
    hospital_reachable = Column(Boolean, default=True)
    nearest_hospital_dist_km = Column(Float, default=0.0)
    estimated_transit_minutes = Column(Float, default=0.0)
    graph_metrics = Column(JSON, default=dict)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)


class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), nullable=True, index=True)
    source = Column(String(150), nullable=False) # PIB, DD News, Disaster Watch
    original_url = Column(String(500), nullable=True)
    headline = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    hazard_category = Column(String(100), default="Flood")
    location_tag = Column(String(150), default="Uttarakhand")
    verification_status = Column(String(50), default="verified_media") # verified_official, verified_media, unconfirmed
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    retrieved_at = Column(DateTime, default=datetime.datetime.utcnow)


class OfficialAlert(Base):
    __tablename__ = "official_alerts"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), nullable=True, index=True)
    authority = Column(String(100), nullable=False) # NDMA SACHET, IMD, CWC, SDMA
    alert_level = Column(String(50), default="RED", index=True) # RED, ORANGE, YELLOW
    headline = Column(String(300), nullable=False)
    instruction = Column(Text, nullable=False)
    effective_until = Column(DateTime, nullable=True)
    source_url = Column(String(500), nullable=True)
    verification_status = Column(String(50), default="official_verified")
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    retrieved_at = Column(DateTime, default=datetime.datetime.utcnow)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="ndma_guideline") # ndma_guideline, sop_flood, glof_management
    source_authority = Column(String(150), default="National Disaster Management Authority (NDMA)")
    content_text = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SituationReport(Base):
    __tablename__ = "situation_reports"

    id = Column(Integer, primary_key=True, index=True)
    disaster_id = Column(Integer, ForeignKey("disaster_events.id"), index=True)
    report_title = Column(String(255), nullable=False)
    incident_version = Column(String(50), default="v1.0")
    status = Column(String(50), default="draft_for_review") # draft_for_review, approved_official
    generated_by = Column(String(100), default="RESQ-X Automated Situation Engine")
    report_data_json = Column(JSON, nullable=False)
    pdf_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# Aliases satisfying Section E model names
DisasterIncident = DisasterEvent
PriorityAssessment = RescuePriority
ResourceInventory = Resource
RescueMission = Mission
RescueRoute = Route

