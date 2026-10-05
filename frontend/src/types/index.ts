export interface DisasterEvent {
  id: number;
  name: string;
  disaster_type: string;
  status: string;
  description?: string;
  incident_date: string;
  center_lat: number;
  center_lon: number;
  aoi_geojson?: any;
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

export interface LayerVisibility {
  satellite: boolean;
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
