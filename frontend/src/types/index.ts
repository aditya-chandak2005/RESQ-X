export interface DisasterEvent {
  id: number;
  name: string;
  disaster_type: string;
  status: string;
  description?: string;
  incident_date: string;
  start_date?: string;
  end_date?: string;
  state?: string;
  district?: string;
  place_name?: string;
  country?: string;
  severity?: string;
  center_lat: number;
  center_lon: number;
  aoi_geojson?: any;
  source_org?: string;
  source_url?: string;
  verification_status?: string;
}

export interface DashboardKpis {
  flooded_area_sqkm: number;
  affected_buildings: number;
  blocked_roads: number;
  critical_bridges: number;
  exposed_population: number;
  isolated_settlements: number;
  critical_priority_zones: number;
  active_rescue_missions: number;
}

export interface FloodPolygon {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  depth_estimate_m: number;
  confidence: number;
  area_sqm: number;
  geometry_geojson: {
    type: string;
    coordinates: number[][][];
  };
}

export interface FloodResult {
  id: number;
  analysis_timestamp: string;
  model_name: string;
  model_version: string;
  confidence_score: number;
  total_flooded_area_sqkm: number;
  severity_breakdown: Record<string, number>;
  validation_iou: number;
  validation_f1: number;
  polygons: FloodPolygon[];
}

export interface Settlement {
  id: number;
  name: string;
  settlement_type: string;
  estimated_population: number;
  population_source: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  is_isolated: boolean;
  isolation_reason?: string;
  nearest_hospital_name?: string;
  nearest_hospital_dist_km: number;
  nearest_town_dist_km: number;
  connectivity_status: string;
  flood_severity_exposure: string;
  priority_score?: number;
  priority_level?: string;
  explanations?: string[];
}

export interface Bridge {
  id: number;
  osm_id?: string;
  name: string;
  road_name: string;
  latitude: number;
  longitude: number;
  status: 'open' | 'at_risk' | 'critical' | 'destroyed';
  water_clearance_m: number;
  confidence: number;
  verification_status: string;
}

export interface RoadSegment {
  id: number;
  osm_id?: string;
  name: string;
  highway_type: string;
  length_m: number;
  status: string;
  is_blocked: boolean;
  blockage_reason?: string;
  geometry_geojson: {
    type: string;
    coordinates: number[][];
  };
}

export interface InfrastructureAsset {
  id: number;
  name?: string;
  asset_type: string;
  latitude: number;
  longitude: number;
  status: string;
  damage_probability: number;
  confidence: number;
  verification_status: string;
  source: string;
}

export interface RescuePriority {
  id: number;
  settlement_id: number;
  settlement_name: string;
  priority_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  flood_severity_factor: number;
  population_factor: number;
  connectivity_loss_factor: number;
  hospital_accessibility_factor: number;
  route_availability_factor: number;
  explanations: string[];
}

export interface RescueTeam {
  id: number;
  name: string;
  team_type: string;
  status: string;
  personnel_count: number;
  equipment_summary: string;
  current_lat: number;
  current_lon: number;
}

export interface Route {
  id: number;
  mission_id?: number;
  origin_name: string;
  origin_lat: number;
  origin_lon: number;
  dest_name: string;
  dest_lat: number;
  dest_lon: number;
  distance_km: number;
  eta_minutes: number;
  is_alternate: boolean;
  is_compromised: boolean;
  safety_score: number;
  waypoints_geojson: {
    type: string;
    coordinates: number[][];
  };
  blocked_segments: any[];
}

export interface Mission {
  id: number;
  disaster_id: number;
  settlement_id: number;
  settlement_name?: string;
  team_id?: number;
  team_name?: string;
  title: string;
  status: string;
  priority_level: string;
  people_targeted: number;
  notes?: string;
  created_at: string;
  routes: Route[];
}

export interface Resource {
  id: number;
  resource_type: string;
  total_available: number;
  allocated: number;
  base_location_name: string;
}

export type BasemapType = 'satellite' | 'dark' | 'tactical-dark' | 'topo' | 'street';

export interface LayerVisibility {
  basemap: BasemapType;
  satellite: boolean;
  stateBoundaries: boolean;
  floodExtent: boolean;
  floodSeverity: boolean;
  settlements: boolean;
  isolatedOnly: boolean;
  bridges: boolean;
  roads: boolean;
  blockedRoads: boolean;
  hospitals: boolean;
  shelters: boolean;
  rescueTeams: boolean;
  routes: boolean;
  alternateRoutes: boolean;
  floodPath: boolean;
}

export interface LocationAssessment {
  query: {
    latitude: number;
    longitude: number;
    location_label: string;
    timestamp: string;
  };
  overall_status: {
    risk_tier: string;
    safety_score: number;
    status_heading: string;
    status_color: string;
    is_inundated: boolean;
    water_depth_est_m: number;
    distance_to_flood_m: number;
    is_isolated: boolean;
    isolation_reason?: string;
  };
  multi_source_comparison: {
    sar_satellite_ai: {
      sensor: string;
      resolution: string;
      inundation_detected: boolean;
      confidence: string;
      severity: string;
      distance_to_water_m: number;
      method: string;
    };
    copernicus_dem_topography: {
      elevation_m: number;
      in_drainage_corridor: boolean;
      distance_to_dem_hydro_path_m: number;
      slope_hazard: string;
      terrain_profile: string;
    };
    open_meteo_live_hydro: {
      source: string;
      live_river_discharge_m3s: number;
      forecast_3day_m3s: number[];
      forecast_dates: string[];
      elevation_from_gauge_m: number;
      trend: string;
      status: string;
    };
    infrastructure_connectivity: {
      nearest_settlement: {
        name: string;
        distance_km: number;
        is_isolated: boolean;
      };
      nearest_hospital: {
        name: string;
        distance_km: number;
        accessible: boolean;
      };
      nearest_shelter: {
        name: string;
        distance_km: number;
        elevation_m: number;
        status: string;
      };
      nearest_bridge: {
        name: string;
        status: string;
        distance_km: number;
      };
      nearest_road: {
        name: string;
        is_blocked: boolean;
        distance_km: number;
      };
    };
  };
  evacuation_advisory: {
    recommended_action: string;
    target_refuge_name: string;
    target_refuge_distance_km: number;
    target_refuge_elevation_m: number;
    action_advisories: string[];
  };
}

export interface GeocodeResult {
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  type: string;
  source: string;
}

export interface QuickReviewData {
  review_type: string;
  disaster_id: number;
  title: string;
  status_badge: string;
  status_color: string;
  generated_at: string;
  summary: string;
  metrics?: any;
  key_findings?: any[];
  critical_red_flags?: any[];
  recommended_actions?: any[];
  recommended_command_directives?: any[];
  settlement_breakdown?: any[];
  teams_status?: any[];
  resources_status?: any[];
  phases?: any[];
}

export interface DisasterKnowledgeItem {
  id: string;
  name: string;
  title?: string;
  category: string;
  summary: string;
  description?: string;
  trigger_mechanisms?: string[];
  precursors: string[];
  immediate_dos: string[];
  immediate_donts: string[];
  critical_donts?: string[];
  historical_precedents?: string[];
  essential_survival_kit?: string[];
  rescue_protocols: string[];
  medical_guidance?: string[];
  medical_field_guidelines: string[];
}

export interface OfficialAlert {
  id: number;
  disaster_id?: number;
  authority: string;
  alert_level: 'RED' | 'ORANGE' | 'YELLOW' | string;
  headline: string;
  instruction: string;
  effective_until?: string;
  source_url?: string;
  verification_status: string;
  published_at: string;
}

export interface NewsItem {
  id: number;
  disaster_id?: number;
  source: string;
  original_url?: string;
  headline: string;
  summary: string;
  hazard_category: string;
  location_tag: string;
  verification_status: string;
  published_at: string;
}

export interface IncidentSource {
  id: number;
  provider_name: string;
  record_identifier?: string;
  source_url?: string;
  publication_date?: string;
  retrieval_timestamp?: string;
  ingestion_status: string;
  coverage_limitations?: string;
  raw_metadata?: Record<string, any>;
}

export interface IncidentDetail {
  id: number;
  name: string;
  alternative_names?: string[];
  disaster_type: string;
  status: string;
  description?: string;
  incident_date: string;
  start_date?: string;
  end_date?: string;
  date_precision?: string;
  state: string;
  district?: string;
  place_name?: string;
  country: string;
  center_lat: number;
  center_lon: number;
  aoi_geojson?: any;
  severity?: string;
  source_org?: string;
  source_url?: string;
  source_record_id?: string;
  source_published_at?: string;
  verification_status: 'verified' | 'unverified' | 'demo' | string;
  data_availability?: Record<string, any>;
  known_limitations?: string;
  sources?: IncidentSource[];
  scenes_count?: number;
  has_flood_analysis?: boolean;
  affected_settlements_count?: number;
}

export interface IncidentSearchResponse {
  total_count: number;
  page: number;
  page_size: number;
  items: IncidentDetail[];
  year_distribution: Record<string, number>;
  hazard_distribution: Record<string, number>;
  applied_filters: Record<string, any>;
}

export interface DataAvailability {
  incident_id: number;
  incident_name: string;
  verification_status: string;
  source_status: string;
  satellite_imagery: string;
  flood_analysis: string;
  infrastructure_data: string;
  population_exposure: string;
  report: string;
  data_sources: string[];
  limitations_summary?: string;
}

export interface GeocodingPlace {
  place_id: string;
  name: string;
  display_name: string;
  feature_type: string;
  district?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  bbox?: number[];
  boundary_geojson?: any;
  provider: string;
  confidence: number;
  is_ambiguous?: boolean;
  alternate_matches?: any[];
}

