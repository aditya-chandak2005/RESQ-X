import {
  DisasterEvent,
  DashboardKpis,
  FloodResult,
  Settlement,
  Bridge,
  RoadSegment,
  InfrastructureAsset,
  RescuePriority,
  RescueTeam,
  Mission,
  Resource,
  IncidentDetail,
  IncidentSearchResponse,
  DataAvailability,
  IncidentSource,
  GeocodingPlace,
  SearchInterpretResponse,
  HistoricalFloodSummaryResponse,
} from '../types';

const API_BASE = '/api';

export const api = {
  async getDisasters(): Promise<DisasterEvent[]> {
    const res = await fetch(`${API_BASE}/disasters`);
    if (!res.ok) throw new Error('Failed to fetch disasters');
    return res.json();
  },

  async getKpis(disasterId: number = 1): Promise<DashboardKpis> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/kpis`);
    if (!res.ok) throw new Error('Failed to fetch KPIs');
    return res.json();
  },

  async getFloodResult(disasterId: number = 1): Promise<FloodResult> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/flood`);
    if (!res.ok) throw new Error('Failed to fetch flood result');
    return res.json();
  },

  async getSettlements(disasterId: number = 1): Promise<Settlement[]> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/settlements`);
    if (!res.ok) throw new Error('Failed to fetch settlements');
    return res.json();
  },

  async getDamage(disasterId: number = 1): Promise<{
    assets: InfrastructureAsset[];
    bridges: Bridge[];
    roads: RoadSegment[];
  }> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/damage`);
    if (!res.ok) throw new Error('Failed to fetch damage overview');
    return res.json();
  },

  async getPriorities(disasterId: number = 1): Promise<RescuePriority[]> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/priority`);
    if (!res.ok) throw new Error('Failed to fetch rescue priorities');
    return res.json();
  },

  async getResources(disasterId: number = 1): Promise<Resource[]> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/resources`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  async getTeams(disasterId: number = 1): Promise<RescueTeam[]> {
    const res = await fetch(`${API_BASE}/missions/teams?disaster_id=${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async getMissions(disasterId: number = 1): Promise<Mission[]> {
    const res = await fetch(`${API_BASE}/missions?disaster_id=${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch missions');
    return res.json();
  },

  async analyzeDisaster(disasterId: number = 1, params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run disaster pipeline');
    return res.json();
  },

  async submitFieldReport(reportData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/missions/field-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) throw new Error('Failed to submit field report');
    return res.json();
  },

  async runSimulation(simulationData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationData),
    });
    if (!res.ok) throw new Error('Failed to run scenario simulation');
    return res.json();
  },

  async queryCopilot(query: string, disasterId: number = 1, conversationHistory?: any[]): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, disaster_id: disasterId, conversation_history: conversationHistory }),
    });
    if (!res.ok) throw new Error('Copilot query failed');
    return res.json();
  },

  async getContextQuickQueries(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/quick-queries/${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch context quick queries');
    return res.json();
  },

  async getQuickReview(disasterId: number = 1, reviewType: string = 'executive'): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/quick-review/${disasterId}?review_type=${reviewType}`);
    if (!res.ok) throw new Error('Failed to fetch quick review');
    return res.json();
  },

  async getDisasterKnowledge(): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/disaster-knowledge`);
    if (!res.ok) throw new Error('Failed to fetch disaster knowledge catalog');
    return res.json();
  },

  async getDisasterKnowledgeDetail(topic: string): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/disaster-knowledge/${topic}`);
    if (!res.ok) throw new Error(`Failed to fetch disaster knowledge for ${topic}`);
    return res.json();
  },

  async searchDisasterKnowledge(query: string, category?: string, topK: number = 4): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, category, top_k: topK }),
    });
    if (!res.ok) throw new Error('Failed to search disaster knowledge base');
    return res.json();
  },

  async getSituationReport(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/${disasterId}`);
    if (!res.ok) throw new Error('Failed to generate situation report');
    return res.json();
  },

  async getVulnerability(): Promise<any> {
    const res = await fetch(`${API_BASE}/vulnerability`);
    if (!res.ok) throw new Error('Failed to get vulnerability index');
    return res.json();
  },

  async getFloodPath(params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to calculate downstream flood path');
    return res.json();
  },

  async assessLocation(params: { latitude: number; longitude: number; disaster_id?: number; location_label?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/intelligence/assess-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to assess location');
    return res.json();
  },

  async geocode(query: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/intelligence/geocode?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Geocoding failed');
    return res.json();
  },

  async getAlerts(disasterId?: number, alertLevel?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (disasterId) params.append('disaster_id', disasterId.toString());
    if (alertLevel) params.append('alert_level', alertLevel);
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch official alerts');
    return res.json();
  },

  async getNews(disasterId?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (disasterId) params.append('disaster_id', disasterId.toString());
    const res = await fetch(`${API_BASE}/news?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch disaster news');
    return res.json();
  },

  async syncAlerts(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/sync?disaster_id=${disasterId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync alerts');
    return res.json();
  },

  async syncNews(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/news/sync?disaster_id=${disasterId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync news');
    return res.json();
  },

  async getKnowledgeDocuments(category?: string): Promise<any[]> {
    const url = category ? `${API_BASE}/knowledge?category=${encodeURIComponent(category)}` : `${API_BASE}/knowledge`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch knowledge documents');
    return res.json();
  },

  async queryKnowledgeRag(query: string, topK: number = 3): Promise<any> {
    const res = await fetch(`${API_BASE}/knowledge/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) throw new Error('Failed to query knowledge RAG');
    return res.json();
  },

  async getValidationBenchmark(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/validation/benchmark?disaster_id=${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch validation benchmark');
    return res.json();
  },

  getSituationReportPdfUrl(disasterId: number = 1): string {
    return `${API_BASE}/reports/${disasterId}/pdf`;
  },

  async searchIncidents(filters: {
    q?: string;
    location?: string;
    hazard_type?: string;
    status?: string;
    state?: string;
    district?: string;
    year_from?: number;
    year_to?: number;
    verification?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<IncidentSearchResponse> {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.location) params.append('location', filters.location);
    if (filters.hazard_type && filters.hazard_type !== 'all') params.append('hazard_type', filters.hazard_type);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.state && filters.state !== 'all') params.append('state', filters.state);
    if (filters.district && filters.district !== 'all') params.append('district', filters.district);
    if (filters.year_from) params.append('year_from', filters.year_from.toString());
    if (filters.year_to) params.append('year_to', filters.year_to.toString());
    if (filters.verification && filters.verification !== 'all') params.append('verification', filters.verification);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search disaster incidents');
    return res.json();
  },

  async getIncidentDetails(incidentId: number): Promise<IncidentDetail> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
    if (!res.ok) throw new Error(`Failed to fetch incident ${incidentId}`);
    return res.json();
  },

  async getIncidentDataAvailability(incidentId: number): Promise<DataAvailability> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/data-availability`);
    if (!res.ok) throw new Error(`Failed to fetch data availability for incident ${incidentId}`);
    return res.json();
  },

  async getIncidentSources(incidentId: number): Promise<IncidentSource[]> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/sources`);
    if (!res.ok) throw new Error(`Failed to fetch incident sources for ${incidentId}`);
    return res.json();
  },

  async spatialIncidentSearch(payload: any): Promise<IncidentDetail[]> {
    const res = await fetch(`${API_BASE}/incidents/spatial-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to execute spatial incident search');
    return res.json();
  },

  async searchGeocodingPlaces(query: string, limit: number = 8): Promise<{
    query: string;
    total_matches: number;
    places: GeocodingPlace[];
    provider_attribution: string;
  }> {
    const res = await fetch(`${API_BASE}/geocoding/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error('Geocoding search failed');
    return res.json();
  },

  async getPlaceDetails(placeId: string): Promise<GeocodingPlace> {
    const res = await fetch(`${API_BASE}/places/${encodeURIComponent(placeId)}`);
    if (!res.ok) throw new Error(`Place not found: ${placeId}`);
    return res.json();
  },

  async resolvePlaceCoordinates(lat: number, lon: number): Promise<any> {
    const res = await fetch(`${API_BASE}/places/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lon }),
    });
    if (!res.ok) throw new Error('Place resolution failed');
    return res.json();
  },

  async interpretSearch(
    query: string,
    currentPlaceId?: string,
    currentIncidentId?: number
  ): Promise<SearchInterpretResponse> {
    const res = await fetch(`${API_BASE}/search/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        current_place_id: currentPlaceId,
        current_incident_id: currentIncidentId,
      }),
    });
    if (!res.ok) throw new Error('Search interpretation failed');
    return res.json();
  },

  async getHistoricalFloodsByPlace(
    placeId: string,
    yearFrom?: number,
    yearTo?: number,
    windowYears: number = 10
  ): Promise<HistoricalFloodSummaryResponse> {
    const params = new URLSearchParams();
    if (yearFrom) params.append('year_from', yearFrom.toString());
    if (yearTo) params.append('year_to', yearTo.toString());
    if (windowYears) params.append('window_years', windowYears.toString());

    const res = await fetch(`${API_BASE}/places/${encodeURIComponent(placeId)}/historical-floods?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch historical floods for place: ${placeId}`);
    return res.json();
  },

  async getPlaceDisasters(placeId: string): Promise<{
    place: GeocodingPlace;
    total_incidents: number;
    incidents: IncidentDetail[];
  }> {
    const res = await fetch(`${API_BASE}/places/${encodeURIComponent(placeId)}/disasters`);
    if (!res.ok) throw new Error(`Failed to fetch disasters for place: ${placeId}`);
    return res.json();
  }
};

